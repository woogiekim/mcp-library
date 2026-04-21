package com.mcplibrary.infrastructure.persistence

import com.mcplibrary.domain.usecase.*
import jakarta.persistence.*
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.time.Instant
import java.util.UUID

@Repository
class UseCaseJpaRepositoryAdapter(
    private val jpaRepo: UseCaseJpaEntityRepository,
    private val scenarioRepo: ScenarioJpaEntityRepository,
    private val ruleRepo: RuleJpaEntityRepository,
    private val exceptionRepo: ExceptionJpaEntityRepository,
) : UseCaseRepository {

    override fun save(useCase: UseCase): UseCase {
        val entity = useCase.toEntity()
        jpaRepo.save(entity)
        scenarioRepo.deleteByUseCaseId(entity.id)
        ruleRepo.deleteByUseCaseId(entity.id)
        exceptionRepo.deleteByUseCaseId(entity.id)
        useCase.scenarios().items().forEach { scenarioRepo.save(it.toEntity(entity.id)) }
        useCase.rules().items().forEach { ruleRepo.save(it.toEntity(entity.id)) }
        useCase.exceptions().items().forEach { exceptionRepo.save(it.toEntity(entity.id)) }
        return findById(useCase.id)!!
    }

    override fun findById(id: UseCaseId): UseCase? {
        val entity = jpaRepo.findById(id.value).orElse(null) ?: return null
        return entity.toDomain(
            scenarios = scenarioRepo.findByUseCaseId(entity.id),
            rules = ruleRepo.findByUseCaseId(entity.id),
            exceptions = exceptionRepo.findByUseCaseId(entity.id),
        )
    }

    override fun findAll(): List<UseCase> = jpaRepo.findAll().map { entity ->
        entity.toDomain(
            scenarios = scenarioRepo.findByUseCaseId(entity.id),
            rules = ruleRepo.findByUseCaseId(entity.id),
            exceptions = exceptionRepo.findByUseCaseId(entity.id),
        )
    }

    override fun findByDomain(domain: Domain): List<UseCase> =
        jpaRepo.findByDomain(domain.value).map { entity ->
            entity.toDomain(
                scenarios = scenarioRepo.findByUseCaseId(entity.id),
                rules = ruleRepo.findByUseCaseId(entity.id),
                exceptions = exceptionRepo.findByUseCaseId(entity.id),
            )
        }

    override fun delete(id: UseCaseId) {
        scenarioRepo.deleteByUseCaseId(id.value)
        ruleRepo.deleteByUseCaseId(id.value)
        exceptionRepo.deleteByUseCaseId(id.value)
        jpaRepo.deleteById(id.value)
    }

    override fun existsById(id: UseCaseId): Boolean = jpaRepo.existsById(id.value)
}

interface UseCaseJpaEntityRepository : JpaRepository<UseCaseEntity, UUID> {
    fun findByDomain(domain: String): List<UseCaseEntity>
}

interface ScenarioJpaEntityRepository : JpaRepository<ScenarioEntity, UUID> {
    fun findByUseCaseId(useCaseId: UUID): List<ScenarioEntity>
    fun deleteByUseCaseId(useCaseId: UUID)
}

interface RuleJpaEntityRepository : JpaRepository<RuleEntity, UUID> {
    fun findByUseCaseId(useCaseId: UUID): List<RuleEntity>
    fun deleteByUseCaseId(useCaseId: UUID)
}

interface ExceptionJpaEntityRepository : JpaRepository<ExceptionEntity, UUID> {
    fun findByUseCaseId(useCaseId: UUID): List<ExceptionEntity>
    fun deleteByUseCaseId(useCaseId: UUID)
}

@Entity @Table(name = "use_cases")
data class UseCaseEntity(
    @Id val id: UUID = UUID.randomUUID(),
    val domain: String = "",
    val title: String = "",
    val version: String = "1.0.0",
    val createdAt: Instant = Instant.now(),
    val updatedAt: Instant = Instant.now(),
)

@Entity @Table(name = "scenarios")
data class ScenarioEntity(
    @Id val id: UUID = UUID.randomUUID(),
    val useCaseId: UUID = UUID.randomUUID(),
    val stepOrder: Int = 1,
    val description: String = "",
    val expected: String? = null,
)

@Entity @Table(name = "rules")
data class RuleEntity(
    @Id val id: UUID = UUID.randomUUID(),
    val useCaseId: UUID = UUID.randomUUID(),
    val description: String = "",
    @Column(name = "constraint_text") val constraint: String = "",
)

@Entity @Table(name = "exceptions")
data class ExceptionEntity(
    @Id val id: UUID = UUID.randomUUID(),
    val useCaseId: UUID = UUID.randomUUID(),
    val condition: String = "",
    val handling: String = "",
)

fun UseCase.toEntity() = UseCaseEntity(
    id = id.value, domain = domain.value, title = title.value,
    version = version.value, createdAt = createdAt, updatedAt = updatedAt(),
)

fun Scenario.toEntity(useCaseId: UUID) = ScenarioEntity(id, useCaseId, stepOrder, description, expected)
fun Rule.toEntity(useCaseId: UUID) = RuleEntity(id, useCaseId, description, constraint)
fun ExceptionCase.toEntity(useCaseId: UUID) = ExceptionEntity(id, useCaseId, condition, handling)

fun UseCaseEntity.toDomain(
    scenarios: List<ScenarioEntity>,
    rules: List<RuleEntity>,
    exceptions: List<ExceptionEntity>,
) = UseCase.reconstitute(
    id = UseCaseId.of(id.toString()),
    domain = Domain(domain),
    title = Title(title),
    version = Version(version),
    scenarios = Scenarios.of(scenarios.map { Scenario(it.id, it.stepOrder, it.description, it.expected) }),
    rules = Rules.of(rules.map { Rule(it.id, it.description, it.constraint) }),
    exceptions = Exceptions.of(exceptions.map { ExceptionCase(it.id, it.condition, it.handling) }),
    createdAt = createdAt,
    updatedAt = updatedAt,
)
