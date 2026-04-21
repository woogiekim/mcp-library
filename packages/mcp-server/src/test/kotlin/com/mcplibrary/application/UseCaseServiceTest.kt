package com.mcplibrary.application

import com.mcplibrary.domain.search.KeywordSearchPort
import com.mcplibrary.domain.search.ScoredChunk
import com.mcplibrary.domain.search.UseCaseChunk
import com.mcplibrary.domain.search.VectorSearchPort
import com.mcplibrary.domain.usecase.*
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import kotlin.test.assertEquals
import kotlin.test.assertNotNull

class UseCaseServiceTest {

    private val useCaseRepository = mockk<UseCaseRepository>()
    private val vectorSearchPort = mockk<VectorSearchPort>(relaxed = true)
    private val keywordSearchPort = mockk<KeywordSearchPort>()
    private val service = UseCaseService(useCaseRepository, vectorSearchPort, keywordSearchPort)

    private fun sampleCommand() = CreateUseCaseCommand(
        domain = "payment",
        title = "결제 취소 처리",
        version = "1.0.0",
        scenarios = listOf(
            ScenarioInput(1, "사용자가 취소를 요청한다"),
            ScenarioInput(2, "시스템이 환불을 처리한다"),
        ),
        rules = listOf(RuleInput("취소는 결제 후 24시간 이내에만 가능하다", "createdAt + 24h > now")),
    )

    @Test
    fun `UseCase 생성 시 Repository에 저장되고 ID가 반환된다`() {
        val command = sampleCommand()
        every { useCaseRepository.save(any()) } answers { firstArg() }

        val id = service.create(command)

        assertNotNull(id)
        verify { useCaseRepository.save(any()) }
    }

    @Test
    fun `UseCase 생성 시 Vector 인덱싱이 수행된다`() {
        every { useCaseRepository.save(any()) } answers { firstArg() }

        service.create(sampleCommand())

        verify(atLeast = 1) { vectorSearchPort.index(any()) }
    }

    @Test
    fun `존재하지 않는 ID 조회 시 UseCaseNotFoundException이 발생한다`() {
        val id = UseCaseId.generate()
        every { useCaseRepository.findById(id) } returns null

        assertThrows<UseCaseNotFoundException> { service.getById(id) }
    }

    @Test
    fun `search는 vector 결과와 keyword 결과를 병합한다`() {
        val useCase = makeUseCase()
        val chunk = UseCaseChunk("id", useCase.id, com.mcplibrary.domain.search.ChunkType.RULE, "text")

        every { vectorSearchPort.search(any(), any()) } returns listOf(ScoredChunk(chunk, 0.9f))
        every { keywordSearchPort.search(any(), any()) } returns listOf(useCase)
        every { useCaseRepository.findById(useCase.id) } returns useCase

        val results = service.search("결제 취소")

        assertEquals(1, results.size)
    }

    @Test
    fun `delete 시 존재하지 않으면 UseCaseNotFoundException이 발생한다`() {
        val id = UseCaseId.generate()
        every { useCaseRepository.existsById(id) } returns false

        assertThrows<UseCaseNotFoundException> { service.delete(id) }
    }

    private fun makeUseCase() = UseCase.create(
        domain = Domain("payment"),
        title = Title("결제 취소 처리"),
        version = Version("1.0.0"),
        scenarios = Scenarios.of(Scenario(stepOrder = 1, description = "사용자가 취소를 요청한다")),
        rules = Rules.of(Rule(description = "24시간 이내 취소 가능", constraint = "createdAt + 24h > now")),
        exceptions = Exceptions.empty(),
    )
}
