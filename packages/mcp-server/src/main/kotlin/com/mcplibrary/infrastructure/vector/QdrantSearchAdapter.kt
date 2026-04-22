package com.mcplibrary.infrastructure.vector

import com.fasterxml.jackson.annotation.JsonIgnoreProperties
import com.fasterxml.jackson.annotation.JsonProperty
import com.mcplibrary.domain.search.*
import com.mcplibrary.domain.usecase.UseCaseId
import com.mcplibrary.infrastructure.llm.HttpClientFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Component
import org.springframework.web.client.RestClient

@Component
class QdrantSearchAdapter(
    @Value("\${qdrant.host:localhost}") private val host: String,
    @Value("\${qdrant.port:6333}") private val httpPort: Int,
    private val embeddingService: EmbeddingService,
) : VectorSearchPort {

    private val collectionName = "use_case_chunks"
    private val vectorSize = 384

    private val restClient: RestClient by lazy {
        HttpClientFactory.restClient(
            "http://$host:$httpPort",
            "Content-Type" to "application/json",
        )
    }

    override fun index(chunk: UseCaseChunk) {
        ensureCollection()
        val embedding = embeddingService.embed(chunk.text)
        val body = UpsertRequest(
            points = listOf(
                Point(
                    id = chunk.id.hashCode().toLong().let { if (it < 0) -it else it },
                    vector = embedding.toList(),
                    payload = mapOf(
                        "use_case_id" to chunk.useCaseId.value.toString(),
                        "chunk_type" to chunk.chunkType.name,
                        "text" to chunk.text,
                        "chunk_id" to chunk.id,
                    ),
                )
            )
        )
        restClient.put()
            .uri("/collections/$collectionName/points")
            .body(body)
            .retrieve()
            .toBodilessEntity()
    }

    override fun search(query: String, limit: Int): List<ScoredChunk> {
        ensureCollection()
        val embedding = embeddingService.embed(query)
        val body = SearchRequest(vector = embedding.toList(), limit = limit, withPayload = true)

        val response = runCatching {
            restClient.post()
                .uri("/collections/$collectionName/points/search")
                .body(body)
                .retrieve()
                .body(SearchResponse::class.java)
        }.getOrNull() ?: return emptyList()

        return response.result.map { hit ->
            val chunk = UseCaseChunk(
                id = hit.payload["chunk_id"] as? String ?: hit.id.toString(),
                useCaseId = UseCaseId.of(hit.payload["use_case_id"] as String),
                chunkType = ChunkType.valueOf(hit.payload["chunk_type"] as String),
                text = hit.payload["text"] as? String ?: "",
            )
            ScoredChunk(chunk, hit.score)
        }
    }

    override fun deleteByUseCaseId(useCaseId: UseCaseId) {
        val body = DeleteByFilterRequest(
            filter = Filter(
                must = listOf(FieldCondition(key = "use_case_id", match = Match(value = useCaseId.value.toString())))
            )
        )
        runCatching {
            restClient.post()
                .uri("/collections/$collectionName/points/delete")
                .body(body)
                .retrieve()
                .toBodilessEntity()
        }
    }

    private fun ensureCollection() {
        val exists = runCatching {
            restClient.get().uri("/collections/$collectionName").retrieve().toBodilessEntity()
            true
        }.getOrDefault(false)

        if (!exists) {
            runCatching {
                restClient.put()
                    .uri("/collections/$collectionName")
                    .body(CreateCollectionRequest(vectors = VectorParams(size = vectorSize, distance = "Cosine")))
                    .retrieve()
                    .toBodilessEntity()
            }
        }
    }

    private data class UpsertRequest(val points: List<Point>)
    private data class Point(val id: Long, val vector: List<Float>, val payload: Map<String, String>)
    private data class SearchRequest(val vector: List<Float>, val limit: Int, @JsonProperty("with_payload") val withPayload: Boolean)
    private data class DeleteByFilterRequest(val filter: Filter)
    private data class Filter(val must: List<FieldCondition>)
    private data class FieldCondition(val key: String, val match: Match)
    private data class Match(val value: String)
    private data class CreateCollectionRequest(val vectors: VectorParams)
    private data class VectorParams(val size: Int, val distance: String)

    @JsonIgnoreProperties(ignoreUnknown = true)
    private data class SearchResponse(val result: List<SearchHit> = emptyList())

    @JsonIgnoreProperties(ignoreUnknown = true)
    private data class SearchHit(val id: Long = 0, val score: Float = 0f, val payload: Map<String, Any> = emptyMap())
}

@Component
class EmbeddingService {
    fun embed(text: String): FloatArray {
        // 로컬 실행용 placeholder: 텍스트 해시 기반 결정적 벡터.
        // 운영 시 Ollama /api/embeddings 또는 sentence-transformers 서비스로 교체.
        val seed = text.hashCode().toLong()
        val rng = java.util.Random(seed)
        return FloatArray(384) { rng.nextFloat() * 2f - 1f }
    }
}
