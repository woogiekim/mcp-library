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
        // 키워드 검색이 필터 역할 — 매칭되지 않는 항목은 벡터 점수와 무관하게 제외
        val keywordResults = keywordSearchPort.search(query, limit * 2)
        if (keywordResults.isEmpty()) return emptyList()

        // 벡터 점수는 키워드 매칭된 항목의 재정렬에만 사용
        val vectorScores = vectorSearchPort.search(query, limit)
            .groupBy { it.chunk.useCaseId }
            .mapValues { (_, chunks) -> chunks.maxOf { it.score } }

        return keywordResults
            .map { uc -> uc to (vectorScores[uc.id] ?: 0f) }
            .sortedByDescending { (_, score) -> score }
            .take(limit)
            .map { (uc, _) -> uc }
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
