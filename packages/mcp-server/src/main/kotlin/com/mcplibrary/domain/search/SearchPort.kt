package com.mcplibrary.domain.search

import com.mcplibrary.domain.usecase.UseCase
import com.mcplibrary.domain.usecase.UseCaseId

interface VectorSearchPort {
    fun index(chunk: UseCaseChunk)
    fun search(query: String, limit: Int): List<ScoredChunk>
    fun deleteByUseCaseId(useCaseId: UseCaseId)
}

interface KeywordSearchPort {
    fun search(query: String, limit: Int): List<UseCase>
}

data class UseCaseChunk(
    val id: String,
    val useCaseId: UseCaseId,
    val chunkType: ChunkType,
    val text: String,
)

enum class ChunkType { STEP, RULE, CONSTRAINT }

data class ScoredChunk(
    val chunk: UseCaseChunk,
    val score: Float,
)
