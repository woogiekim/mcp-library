package com.mcplibrary.domain.usecase

import java.time.Instant
import java.util.UUID

class UseCase private constructor(
    val id: UseCaseId,
    val domain: Domain,
    val title: Title,
    val version: Version,
    private val scenarios: Scenarios,
    private val rules: Rules,
    private val exceptions: Exceptions,
    val createdAt: Instant,
    private var updatedAt: Instant,
) {
    private val domainEvents: MutableList<UseCaseEvent> = mutableListOf()

    companion object {
        fun create(
            domain: Domain,
            title: Title,
            version: Version,
            scenarios: Scenarios,
            rules: Rules,
            exceptions: Exceptions,
        ): UseCase {
            val now = Instant.now()
            val uc = UseCase(
                id = UseCaseId.generate(),
                domain = domain,
                title = title,
                version = version,
                scenarios = scenarios,
                rules = rules,
                exceptions = exceptions,
                createdAt = now,
                updatedAt = now,
            )
            uc.domainEvents.add(UseCaseCreated(uc.id))
            return uc
        }

        fun reconstitute(
            id: UseCaseId,
            domain: Domain,
            title: Title,
            version: Version,
            scenarios: Scenarios,
            rules: Rules,
            exceptions: Exceptions,
            createdAt: Instant,
            updatedAt: Instant,
        ) = UseCase(id, domain, title, version, scenarios, rules, exceptions, createdAt, updatedAt)
    }

    fun scenarios(): Scenarios = scenarios
    fun rules(): Rules = rules
    fun exceptions(): Exceptions = exceptions
    fun updatedAt(): Instant = updatedAt

    fun update(title: Title, version: Version, scenarios: Scenarios, rules: Rules, exceptions: Exceptions): UseCase {
        val updated = UseCase(id, domain, title, version, scenarios, rules, exceptions, createdAt, Instant.now())
        updated.domainEvents.add(UseCaseUpdated(id))
        return updated
    }

    fun buildContextText(): String {
        val ruleText = rules.items().joinToString("\n") { "- [RULE] ${it.description}: ${it.constraint}" }
        val stepText = scenarios.items().sortedBy { it.stepOrder }
            .joinToString("\n") { "${it.stepOrder}. ${it.description}" }
        return "## ${title.value} (${domain.value})\n$stepText\n$ruleText"
    }

    fun pullDomainEvents(): List<UseCaseEvent> {
        val events = domainEvents.toList()
        domainEvents.clear()
        return events
    }
}
