package com.mcplibrary.domain

import com.mcplibrary.domain.usecase.*
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import kotlin.test.assertEquals
import kotlin.test.assertNotNull
import kotlin.test.assertTrue

class UseCaseTest {

    private fun validScenarios() = Scenarios.of(
        Scenario(stepOrder = 1, description = "사용자가 결제를 요청한다"),
        Scenario(stepOrder = 2, description = "시스템이 결제를 처리한다"),
    )

    private fun validRules() = Rules.of(
        Rule(description = "결제 금액은 0원 초과이어야 한다", constraint = "amount > 0"),
    )

    @Test
    fun `UseCase 생성 시 ID가 자동 부여된다`() {
        val useCase = UseCase.create(
            domain = Domain("payment"),
            title = Title("결제 처리"),
            version = Version("1.0.0"),
            scenarios = validScenarios(),
            rules = validRules(),
            exceptions = Exceptions.empty(),
        )
        assertNotNull(useCase.id)
    }

    @Test
    fun `UseCase 생성 시 UseCaseCreated 이벤트가 발행된다`() {
        val useCase = UseCase.create(
            domain = Domain("payment"),
            title = Title("결제 처리"),
            version = Version("1.0.0"),
            scenarios = validScenarios(),
            rules = validRules(),
            exceptions = Exceptions.empty(),
        )
        val events = useCase.pullDomainEvents()
        assertEquals(1, events.size)
        assertTrue(events.first() is UseCaseCreated)
    }

    @Test
    fun `Domain이 공백이면 생성 실패한다`() {
        assertThrows<IllegalArgumentException> { Domain("") }
        assertThrows<IllegalArgumentException> { Domain("   ") }
    }

    @Test
    fun `Version 형식이 잘못되면 생성 실패한다`() {
        assertThrows<IllegalArgumentException> { Version("1.0") }
        assertThrows<IllegalArgumentException> { Version("v1.0.0") }
        assertThrows<IllegalArgumentException> { Version("latest") }
    }

    @Test
    fun `Version 형식이 올바르면 생성 성공한다`() {
        Version("1.0.0")
        Version("2.14.3")
    }

    @Test
    fun `Scenarios가 비어있으면 생성 실패한다`() {
        assertThrows<IllegalArgumentException> { Scenarios.of(emptyList()) }
    }

    @Test
    fun `Rules가 비어있으면 생성 실패한다`() {
        assertThrows<IllegalArgumentException> { Rules.of(emptyList()) }
    }

    @Test
    fun `stepOrder가 0 이하이면 생성 실패한다`() {
        assertThrows<IllegalArgumentException> {
            Scenario(stepOrder = 0, description = "설명")
        }
    }

    @Test
    fun `buildContextText는 title과 domain을 포함한다`() {
        val useCase = UseCase.create(
            domain = Domain("payment"),
            title = Title("결제 처리"),
            version = Version("1.0.0"),
            scenarios = validScenarios(),
            rules = validRules(),
            exceptions = Exceptions.empty(),
        )
        val context = useCase.buildContextText()
        assertTrue(context.contains("결제 처리"))
        assertTrue(context.contains("payment"))
        assertTrue(context.contains("[RULE]"))
    }
}
