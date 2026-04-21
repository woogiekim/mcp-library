package com.mcplibrary.domain.usecase

import java.util.UUID

@JvmInline
value class UseCaseId(val value: UUID) {
    companion object {
        fun generate() = UseCaseId(UUID.randomUUID())
        fun of(value: String) = UseCaseId(UUID.fromString(value))
    }
}

@JvmInline
value class Domain(val value: String) {
    init { require(value.isNotBlank()) { "도메인은 비어있을 수 없습니다" } }
}

@JvmInline
value class Title(val value: String) {
    init { require(value.isNotBlank()) { "제목은 비어있을 수 없습니다" } }
}

@JvmInline
value class Version(val value: String) {
    init { require(value.matches(Regex("""\d+\.\d+\.\d+"""))) { "버전 형식이 올바르지 않습니다: $value" } }
}

data class Scenario(
    val id: UUID = UUID.randomUUID(),
    val stepOrder: Int,
    val description: String,
    val expected: String? = null,
) {
    init {
        require(stepOrder > 0) { "stepOrder는 1 이상이어야 합니다" }
        require(description.isNotBlank()) { "시나리오 설명은 비어있을 수 없습니다" }
    }
}

class Scenarios(private val items: List<Scenario>) {
    init { require(items.isNotEmpty()) { "시나리오는 최소 1개 이상이어야 합니다" } }
    fun items(): List<Scenario> = items.toList()

    companion object {
        fun of(vararg scenarios: Scenario) = Scenarios(scenarios.toList())
        fun of(scenarios: List<Scenario>) = Scenarios(scenarios)
    }
}

data class Rule(
    val id: UUID = UUID.randomUUID(),
    val description: String,
    val constraint: String,
) {
    init {
        require(description.isNotBlank()) { "규칙 설명은 비어있을 수 없습니다" }
        require(constraint.isNotBlank()) { "제약 조건은 비어있을 수 없습니다" }
    }
}

class Rules(private val items: List<Rule>) {
    init { require(items.isNotEmpty()) { "규칙은 최소 1개 이상이어야 합니다" } }
    fun items(): List<Rule> = items.toList()

    companion object {
        fun of(vararg rules: Rule) = Rules(rules.toList())
        fun of(rules: List<Rule>) = Rules(rules)
    }
}

data class ExceptionCase(
    val id: UUID = UUID.randomUUID(),
    val condition: String,
    val handling: String,
) {
    init {
        require(condition.isNotBlank()) { "예외 조건은 비어있을 수 없습니다" }
        require(handling.isNotBlank()) { "예외 처리는 비어있을 수 없습니다" }
    }
}

class Exceptions(private val items: List<ExceptionCase>) {
    fun items(): List<ExceptionCase> = items.toList()

    companion object {
        fun empty() = Exceptions(emptyList())
        fun of(exceptions: List<ExceptionCase>) = Exceptions(exceptions)
    }
}
