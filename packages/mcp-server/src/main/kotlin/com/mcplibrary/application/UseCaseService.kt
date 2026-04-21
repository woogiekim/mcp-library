package com.mcplibrary.application

import com.mcplibrary.domain.search.ChunkType
import com.mcplibrary.domain.search.KeywordSearchPort
import com.mcplibrary.domain.search.UseCaseChunk
import com.mcplibrary.domain.search.VectorSearchPort
import com.mcplibrary.domain.usecase.*
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class UseCaseService(
    private val useCaseRepository: UseCaseRepository,
    private val vectorSearchPort: VectorSearchPort,
    private val keywordSearchPort: KeywordSearchPort,
) {
    @Transactional
    fun create(command: CreateUseCaseCommand): UseCaseId {
        val useCase = UseCase.create(
            domain = Domain(command.domain),
            title = Title(command.title),
            version = Version(command.version),
            scenarios = Scenarios.of(command.scenarios.map {
                Scenario(stepOrder = it.stepOrder, description = it.description, expected = it.expected)
            }),
            rules = Rules.of(command.rules.map { Rule(description = it.description, constraint = it.constraint) }),
            exceptions = Exceptions.of(command.exceptions.map {
                ExceptionCase(condition = it.condition, handling = it.handling)
            }),
        )
        val saved = useCaseRepository.save(useCase)
        indexChunks(saved)
        return saved.id
    }

    @Transactional(readOnly = true)
    fun getById(id: UseCaseId): UseCase =
        useCaseRepository.findById(id) ?: throw UseCaseNotFoundException(id)

    @Transactional(readOnly = true)
    fun getAll(): List<UseCase> = useCaseRepository.findAll()

    @Transactional(readOnly = true)
    fun search(query: String, limit: Int = 10): List<UseCase> {
        val vectorResults = vectorSearchPort.search(query, limit)
            .map { it.chunk.useCaseId }
            .distinct()

        val keywordResults = keywordSearchPort.search(query, limit)
            .map { it.id }

        val merged = (vectorResults + keywordResults).distinct()
        return merged.mapNotNull { useCaseRepository.findById(it) }
    }

    @Transactional
    fun delete(id: UseCaseId) {
        if (!useCaseRepository.existsById(id)) throw UseCaseNotFoundException(id)
        useCaseRepository.delete(id)
        vectorSearchPort.deleteByUseCaseId(id)
    }

    private fun indexChunks(useCase: UseCase) {
        useCase.scenarios().items().forEach { step ->
            vectorSearchPort.index(UseCaseChunk(
                id = "${useCase.id.value}-step-${step.id}",
                useCaseId = useCase.id,
                chunkType = ChunkType.STEP,
                text = step.description,
            ))
        }
        useCase.rules().items().forEach { rule ->
            vectorSearchPort.index(UseCaseChunk(
                id = "${useCase.id.value}-rule-${rule.id}",
                useCaseId = useCase.id,
                chunkType = ChunkType.RULE,
                text = "${rule.description}: ${rule.constraint}",
            ))
        }
    }
}

class UseCaseNotFoundException(id: UseCaseId) : RuntimeException("UseCase를 찾을 수 없습니다: ${id.value}")
