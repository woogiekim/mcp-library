package com.mcplibrary.infrastructure

import com.mcplibrary.domain.usecase.*
import com.mcplibrary.infrastructure.persistence.KeywordSearchAdapter
import com.mcplibrary.infrastructure.persistence.UseCaseJpaRepositoryAdapter
import io.mockk.every
import io.mockk.mockk
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue

class KeywordSearchAdapterTest {

    private val repo = mockk<UseCaseJpaRepositoryAdapter>()
    private val adapter = KeywordSearchAdapter(repo)

    private fun useCase(domain: String, title: String, vararg ruleDescriptions: String) = UseCase.create(
        domain = Domain(domain),
        title = Title(title),
        version = Version("1.0.0"),
        scenarios = Scenarios.of(Scenario(stepOrder = 1, description = "$title 시나리오")),
        rules = Rules.of(ruleDescriptions.map { Rule(description = it, constraint = "true") }
            .ifEmpty { listOf(Rule(description = "기본 규칙", constraint = "true")) }),
        exceptions = Exceptions.empty(),
    )

    private val orderUseCase = useCase("order", "상품 주문 생성",
        "장바구니에 상품이 최소 1개 이상 있어야 주문 가능")
    private val cancelUseCase = useCase("order", "주문 취소",
        "배송 시작 전(PREPARING 상태)까지만 취소 가능",
        "취소 요청 시점이 결제 완료 후 7일 이내여야 함")
    private val memberUseCase = useCase("member", "회원 등급 산정",
        "BRONZE 0원 이상 SILVER 10만원 이상 GOLD 30만원 이상 PLATINUM 100만원 이상")

    @BeforeEach
    fun setUp() {
        every { repo.findAll() } returns listOf(orderUseCase, cancelUseCase, memberUseCase)
    }

    @Test
    fun `제목 키워드로 검색된다`() {
        val results = adapter.search("주문", 10)
        val titles = results.map { it.title.value }
        assertTrue(titles.contains("상품 주문 생성"))
        assertTrue(titles.contains("주문 취소"))
    }

    @Test
    fun `도메인 키워드로 검색된다`() {
        val results = adapter.search("member", 10)
        assertTrue(results.any { it.domain.value == "member" })
    }

    @Test
    fun `규칙 내용으로도 검색된다`() {
        val results = adapter.search("PLATINUM 등급 기준", 10)
        assertTrue(results.any { it.title.value == "회원 등급 산정" }, "규칙에 PLATINUM이 있는 UseCase가 검색되어야 한다")
    }

    @Test
    fun `한국어 어미 제거 후 매칭된다 - 취소가능 → 취소`() {
        val results = adapter.search("취소가능한지", 10)
        assertTrue(results.any { it.title.value == "주문 취소" }, "'취소가능한지'에서 '취소'를 추출해 매칭해야 한다")
    }

    @Test
    fun `한국어 어미 제거 후 매칭된다 - 등급이 → 등급`() {
        val results = adapter.search("등급이 궁금해요", 10)
        assertTrue(results.any { it.title.value == "회원 등급 산정" }, "'등급이'에서 '등급'을 추출해 매칭해야 한다")
    }

    @Test
    fun `결과는 매칭 점수 내림차순 정렬된다`() {
        // "주문 취소" 쿼리: cancelUseCase가 두 단어 모두 매칭 → 높은 점수
        val results = adapter.search("주문 취소", 10)
        assertTrue(results.isNotEmpty())
        val first = results.first()
        assertEquals("주문 취소", first.title.value, "더 많은 단어가 매칭되는 UseCase가 먼저 와야 한다")
    }

    @Test
    fun `limit 적용 - 결과 수 제한`() {
        val results = adapter.search("주문", 1)
        assertEquals(1, results.size)
    }

    @Test
    fun `매칭 없는 쿼리는 빈 결과`() {
        val results = adapter.search("xyz전혀없는키워드abc", 10)
        assertTrue(results.isEmpty())
    }

    @Test
    fun `짧은 토큰(1자)은 무시된다`() {
        // 1자 토큰으로만 구성된 쿼리
        val results = adapter.search("a b c", 10)
        assertTrue(results.isEmpty(), "1자 토큰은 검색에서 무시되어야 한다")
    }
}
