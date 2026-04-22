package com.mcplibrary.e2e

import com.fasterxml.jackson.databind.ObjectMapper
import com.mcplibrary.domain.search.ScoredChunk
import com.mcplibrary.domain.search.UseCaseChunk
import com.mcplibrary.domain.search.VectorSearchPort
import com.mcplibrary.domain.usecase.UseCaseId
import org.junit.jupiter.api.*
import org.junit.jupiter.api.Assertions.*
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.test.context.TestConfiguration
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Primary
import org.springframework.http.MediaType
import org.springframework.test.context.ActiveProfiles
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.*
import java.nio.charset.StandardCharsets

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@TestMethodOrder(MethodOrderer.OrderAnnotation::class)
class UseCaseApiE2ETest {

    @Autowired lateinit var mockMvc: MockMvc
    @Autowired lateinit var objectMapper: ObjectMapper

    private var orderUseCaseId = ""
    private var cancelUseCaseId = ""
    private var memberUseCaseId = ""

    // ──────────────────────────────────────────────────────────────
    // 테스트 데이터 (각 테스트 그룹 시작 전 필요 시 세팅)
    // ──────────────────────────────────────────────────────────────

    private fun createUseCase(payload: Map<String, Any>): String {
        val result = mockMvc.perform(
            post("/usecases")
                .contentType(MediaType.APPLICATION_JSON)
                .characterEncoding("UTF-8")
                .content(objectMapper.writeValueAsString(payload))
        ).andExpect(status().isCreated).andReturn()

        val body = objectMapper.readValue(
            result.response.getContentAsString(StandardCharsets.UTF_8), Map::class.java
        )
        return body["id"] as String
    }

    private fun json(result: org.springframework.test.web.servlet.MvcResult): Map<*, *> =
        objectMapper.readValue(result.response.getContentAsString(StandardCharsets.UTF_8), Map::class.java)

    @BeforeAll
    fun setup() {
        orderUseCaseId = createUseCase(mapOf(
            "domain" to "order",
            "title" to "상품 주문 생성",
            "version" to "1.0.0",
            "scenarios" to listOf(
                mapOf("stepOrder" to 1, "description" to "고객이 장바구니에서 주문하기 버튼 클릭", "expected" to "주문 확인 화면 표시"),
                mapOf("stepOrder" to 2, "description" to "결제 수단 선택", "expected" to "결제 수단 유효성 확인"),
                mapOf("stepOrder" to 3, "description" to "주문 최종 확인 후 결제 진행", "expected" to "결제 승인 요청"),
            ),
            "rules" to listOf(
                mapOf("description" to "장바구니에 상품이 최소 1개 이상 있어야 주문 가능", "constraint" to "cart.items.size >= 1"),
                mapOf("description" to "모든 상품의 재고가 주문 수량 이상이어야 함", "constraint" to "product.stock >= orderItem.quantity"),
                mapOf("description" to "주문 총액이 0원 초과여야 함", "constraint" to "order.totalAmount > 0"),
            ),
            "exceptions" to listOf(
                mapOf("condition" to "재고 부족", "handling" to "해당 상품 제외 후 계속 주문 여부 사용자에게 확인"),
                mapOf("condition" to "결제 승인 실패", "handling" to "주문을 PENDING 상태로 두고 다른 결제 수단 선택 안내"),
            ),
        ))

        cancelUseCaseId = createUseCase(mapOf(
            "domain" to "order",
            "title" to "주문 취소",
            "version" to "1.0.0",
            "scenarios" to listOf(
                mapOf("stepOrder" to 1, "description" to "고객이 주문 상세 화면에서 취소 요청", "expected" to "취소 가능 여부 즉시 확인"),
                mapOf("stepOrder" to 2, "description" to "시스템이 결제 취소 API 호출", "expected" to "PG사 취소 완료"),
            ),
            "rules" to listOf(
                mapOf("description" to "배송 시작 전(PREPARING 상태)까지만 취소 가능", "constraint" to "order.status IN [PAID, PREPARING]"),
                mapOf("description" to "취소 요청 시점이 결제 완료 후 7일 이내여야 함", "constraint" to "now() < order.paidAt + 7days"),
            ),
            "exceptions" to listOf(
                mapOf("condition" to "배송 중 상태에서 취소 요청", "handling" to "고객센터 연결 안내, 자동 취소 불가"),
            ),
        ))

        memberUseCaseId = createUseCase(mapOf(
            "domain" to "member",
            "title" to "회원 등급 산정",
            "version" to "1.0.0",
            "scenarios" to listOf(
                mapOf("stepOrder" to 1, "description" to "매월 1일 자정 배치 실행 전월 구매 금액 집계", "expected" to "회원별 구매 금액 합산 완료"),
                mapOf("stepOrder" to 2, "description" to "구매 금액 기준으로 등급 결정", "expected" to "BRONZE SILVER GOLD PLATINUM 등급 할당"),
            ),
            "rules" to listOf(
                mapOf("description" to "BRONZE 0원 이상 SILVER 10만원 이상 GOLD 30만원 이상 PLATINUM 100만원 이상 전월 기준", "constraint" to "grade based on lastMonth.purchaseAmount"),
                mapOf("description" to "취소 환불된 금액은 구매 금액에서 제외", "constraint" to "amount = sum(completedOrders) - sum(canceledOrders)"),
            ),
            "exceptions" to listOf(
                mapOf("condition" to "신규 가입 첫 달", "handling" to "등급 산정 제외 다음 달 1일부터 산정 대상 포함"),
            ),
        ))
    }

    // ──────────────────────────────────────────────────────────────
    // 1. UseCase CRUD
    // ──────────────────────────────────────────────────────────────

    @Test @Order(1)
    fun `UseCase 생성 - ID가 발급된다`() {
        assertFalse(orderUseCaseId.isBlank())
        assertFalse(cancelUseCaseId.isBlank())
        assertFalse(memberUseCaseId.isBlank())
    }

    @Test @Order(2)
    fun `UseCase 목록 조회 - 등록한 UseCase가 포함된다`() {
        val result = mockMvc.perform(get("/usecases"))
            .andExpect(status().isOk)
            .andReturn()

        @Suppress("UNCHECKED_CAST")
        val list = objectMapper.readValue(
            result.response.getContentAsString(StandardCharsets.UTF_8), List::class.java
        ) as List<Map<String, Any>>

        val ids = list.map { it["id"] }
        assertTrue(ids.contains(orderUseCaseId))
        assertTrue(ids.contains(cancelUseCaseId))
        assertTrue(ids.contains(memberUseCaseId))
    }

    @Test @Order(3)
    fun `UseCase 단건 조회 - 시나리오·규칙·예외 포함 전체 필드 반환`() {
        val result = mockMvc.perform(get("/usecases/$orderUseCaseId"))
            .andExpect(status().isOk)
            .andReturn()

        val body = json(result)
        assertEquals("상품 주문 생성", body["title"])
        assertEquals("order", body["domain"])
        assertEquals("1.0.0", body["version"])

        @Suppress("UNCHECKED_CAST")
        assertEquals(3, (body["scenarios"] as List<*>).size)
        @Suppress("UNCHECKED_CAST")
        assertEquals(3, (body["rules"] as List<*>).size)
        @Suppress("UNCHECKED_CAST")
        assertEquals(2, (body["exceptions"] as List<*>).size)
    }

    @Test @Order(4)
    fun `UseCase 단건 조회 - 존재하지 않는 ID는 404`() {
        mockMvc.perform(get("/usecases/00000000-0000-0000-0000-000000000000"))
            .andExpect(status().isNotFound)
    }

    // ──────────────────────────────────────────────────────────────
    // 2. 입력값 검증 (도메인 규칙 위반 → 400)
    // ──────────────────────────────────────────────────────────────

    @Test @Order(5)
    fun `UseCase 생성 - 시나리오 없으면 400`() {
        val payload = mapOf(
            "domain" to "order", "title" to "빈 시나리오", "version" to "1.0.0",
            "scenarios" to emptyList<Any>(),
            "rules" to listOf(mapOf("description" to "규칙", "constraint" to "true")),
        )
        mockMvc.perform(
            post("/usecases").contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(payload))
        ).andExpect(status().isBadRequest)
    }

    @Test @Order(6)
    fun `UseCase 생성 - 규칙 없으면 400`() {
        val payload = mapOf(
            "domain" to "order", "title" to "빈 규칙", "version" to "1.0.0",
            "scenarios" to listOf(mapOf("stepOrder" to 1, "description" to "단계")),
            "rules" to emptyList<Any>(),
        )
        mockMvc.perform(
            post("/usecases").contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(payload))
        ).andExpect(status().isBadRequest)
    }

    @Test @Order(7)
    fun `UseCase 생성 - 잘못된 버전 형식은 400`() {
        val payload = mapOf(
            "domain" to "order", "title" to "버전 오류", "version" to "v1.0",
            "scenarios" to listOf(mapOf("stepOrder" to 1, "description" to "단계")),
            "rules" to listOf(mapOf("description" to "규칙", "constraint" to "true")),
        )
        mockMvc.perform(
            post("/usecases").contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(payload))
        ).andExpect(status().isBadRequest)
    }

    @Test @Order(8)
    fun `UseCase 생성 - 빈 도메인은 400`() {
        val payload = mapOf(
            "domain" to "", "title" to "도메인 없음", "version" to "1.0.0",
            "scenarios" to listOf(mapOf("stepOrder" to 1, "description" to "단계")),
            "rules" to listOf(mapOf("description" to "규칙", "constraint" to "true")),
        )
        mockMvc.perform(
            post("/usecases").contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(payload))
        ).andExpect(status().isBadRequest)
    }

    // ──────────────────────────────────────────────────────────────
    // 3. 하이브리드 검색
    // ──────────────────────────────────────────────────────────────

    @Test @Order(9)
    fun `검색 - 주문 관련 쿼리 시 주문 취소 UseCase 반환`() {
        val result = mockMvc.perform(
            post("/search").contentType(MediaType.APPLICATION_JSON)
                .content("""{"query": "주문 취소 가능한 상태"}""")
        ).andExpect(status().isOk).andReturn()

        val body = json(result)
        @Suppress("UNCHECKED_CAST")
        val titles = (body["useCases"] as List<Map<String, Any>>).map { it["title"] }
        assertTrue(titles.contains("주문 취소"), "주문 취소 UseCase가 결과에 포함되어야 한다. 실제: $titles")
    }

    @Test @Order(10)
    fun `검색 - 등급 관련 쿼리 시 회원 등급 UseCase 반환`() {
        val result = mockMvc.perform(
            post("/search").contentType(MediaType.APPLICATION_JSON)
                .content("""{"query": "등급이 어떻게 산정되나요"}""")
        ).andExpect(status().isOk).andReturn()

        val body = json(result)
        @Suppress("UNCHECKED_CAST")
        val titles = (body["useCases"] as List<Map<String, Any>>).map { it["title"] }
        assertTrue(titles.contains("회원 등급 산정"), "회원 등급 산정 UseCase가 결과에 포함되어야 한다. 실제: $titles")
    }

    @Test @Order(11)
    fun `검색 - 매칭 없는 쿼리는 빈 결과`() {
        val result = mockMvc.perform(
            post("/search").contentType(MediaType.APPLICATION_JSON)
                .content("""{"query": "xyzabc전혀없는키워드zzz"}""")
        ).andExpect(status().isOk).andReturn()

        assertEquals(0, json(result)["total"])
    }

    @Test @Order(12)
    fun `검색 - limit 파라미터 적용`() {
        val result = mockMvc.perform(
            post("/search").contentType(MediaType.APPLICATION_JSON)
                .content("""{"query": "주문", "limit": 1}""")
        ).andExpect(status().isOk).andReturn()

        @Suppress("UNCHECKED_CAST")
        val useCases = json(result)["useCases"] as List<*>
        assertTrue(useCases.size <= 1, "limit=1이면 최대 1개만 반환되어야 한다")
    }

    // ──────────────────────────────────────────────────────────────
    // 4. LLM 쿼리 (E2E 핵심: 검색 → 컨텍스트 주입 → 답변)
    // ──────────────────────────────────────────────────────────────

    @Test @Order(13)
    fun `LLM 쿼리 - 주문 취소 질문에 비어있지 않은 답변 반환`() {
        val result = mockMvc.perform(
            post("/query").contentType(MediaType.APPLICATION_JSON)
                .content("""{"query": "배송 중에 주문 취소할 수 있나요"}""")
        ).andExpect(status().isOk).andReturn()

        val body = json(result)
        val answer = body["answer"] as String
        assertTrue(answer.isNotBlank(), "LLM 답변이 비어있지 않아야 한다")
    }

    @Test @Order(14)
    fun `LLM 쿼리 - Mock LLM은 쿼리를 그대로 포함한 답변 반환`() {
        val query = "배송 중에 주문 취소할 수 있나요"
        val result = mockMvc.perform(
            post("/query").contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(mapOf("query" to query)))
        ).andExpect(status().isOk).andReturn()

        val body = json(result)
        val answer = body["answer"] as String
        // Mock LLM 구현: "[MOCK] ${userMessage}"
        assertTrue(answer.contains(query), "Mock LLM 답변에 쿼리가 포함되어야 한다. 실제 답변: $answer")
    }

    @Test @Order(15)
    fun `LLM 쿼리 - usedUseCases에 완전한 UseCase 정보 포함`() {
        val result = mockMvc.perform(
            post("/query").contentType(MediaType.APPLICATION_JSON)
                .content("""{"query": "주문 취소 규칙"}""")
        ).andExpect(status().isOk).andReturn()

        val body = json(result)
        @Suppress("UNCHECKED_CAST")
        val usedUseCases = body["usedUseCases"] as List<Map<String, Any>>
        assertTrue(usedUseCases.isNotEmpty(), "참조된 UseCase가 있어야 한다")

        val first = usedUseCases.first()
        assertNotNull(first["id"])
        assertNotNull(first["domain"])
        assertNotNull(first["title"])
        assertNotNull(first["scenarios"])
        assertNotNull(first["rules"])
    }

    @Test @Order(16)
    fun `LLM 쿼리 - 매칭 UseCase 없어도 정상 처리`() {
        mockMvc.perform(
            post("/query").contentType(MediaType.APPLICATION_JSON)
                .content("""{"query": "xyzabc전혀없는키워드"}""")
        ).andExpect(status().isOk)
            .andExpect(jsonPath("$.answer").isNotEmpty)
    }

    // ──────────────────────────────────────────────────────────────
    // 5. 전체 생애주기 (생성 → 검색 → 조회 → 삭제)
    // ──────────────────────────────────────────────────────────────

    @Test @Order(17)
    fun `전체 생애주기 - 생성 후 검색 가능하고 삭제 후 조회 불가`() {
        // 생성
        val id = createUseCase(mapOf(
            "domain" to "lifecycle",
            "title" to "생애주기 테스트 UseCase",
            "version" to "1.0.0",
            "scenarios" to listOf(mapOf("stepOrder" to 1, "description" to "생애주기 시나리오 단계")),
            "rules" to listOf(mapOf("description" to "생애주기 규칙", "constraint" to "lifecycle.valid == true")),
        ))

        // 조회 가능
        mockMvc.perform(get("/usecases/$id"))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.title").value("생애주기 테스트 UseCase"))

        // 검색에 나타남
        val searchResult = mockMvc.perform(
            post("/search").contentType(MediaType.APPLICATION_JSON)
                .content("""{"query": "생애주기 시나리오"}""")
        ).andExpect(status().isOk).andReturn()

        @Suppress("UNCHECKED_CAST")
        val found = (json(searchResult)["useCases"] as List<Map<String, Any>>).any { it["id"] == id }
        assertTrue(found, "생성된 UseCase가 검색 결과에 포함되어야 한다")

        // 삭제
        mockMvc.perform(delete("/usecases/$id"))
            .andExpect(status().isNoContent)

        // 삭제 후 404
        mockMvc.perform(get("/usecases/$id"))
            .andExpect(status().isNotFound)
    }

    @Test @Order(18)
    fun `삭제 - 존재하지 않는 ID 삭제 시 404`() {
        mockMvc.perform(delete("/usecases/00000000-0000-0000-0000-000000000001"))
            .andExpect(status().isNotFound)
    }

    // ──────────────────────────────────────────────────────────────
    // Test configuration: Qdrant 없이 동작하는 in-memory VectorSearchPort
    // ──────────────────────────────────────────────────────────────

    @TestConfiguration
    class TestVectorSearchConfig {
        @Bean
        @Primary
        fun vectorSearchPort(): VectorSearchPort = object : VectorSearchPort {
            private val store = mutableMapOf<String, UseCaseChunk>()

            override fun index(chunk: UseCaseChunk) {
                store[chunk.id] = chunk
            }

            override fun search(query: String, limit: Int): List<ScoredChunk> {
                val terms = query.lowercase().split(Regex("\\s+")).filter { it.length >= 2 }
                return store.values
                    .filter { chunk -> terms.any { chunk.text.lowercase().contains(it) } }
                    .take(limit)
                    .map { ScoredChunk(it, 0.5f) }
            }

            override fun deleteByUseCaseId(useCaseId: UseCaseId) {
                store.entries.removeIf { it.value.useCaseId == useCaseId }
            }
        }
    }
}
