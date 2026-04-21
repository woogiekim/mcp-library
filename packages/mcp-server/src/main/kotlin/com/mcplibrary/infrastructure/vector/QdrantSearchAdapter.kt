package com.mcplibrary.infrastructure.vector

import com.mcplibrary.domain.search.*
import com.mcplibrary.domain.usecase.UseCaseId
import io.qdrant.client.QdrantClient
import io.qdrant.client.QdrantGrpcClient
import io.qdrant.client.grpc.Collections.*
import io.qdrant.client.grpc.Points.*
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Component
import java.util.UUID

@Component
class QdrantSearchAdapter(
    @Value("\${qdrant.host:localhost}") private val host: String,
    @Value("\${qdrant.port:6334}") private val port: Int,
    private val embeddingService: EmbeddingService,
) : VectorSearchPort {

    private val collectionName = "use_case_chunks"

    private val client: QdrantClient by lazy {
        QdrantClient(QdrantGrpcClient.newBuilder(host, port, false).build())
    }

    override fun index(chunk: UseCaseChunk) {
        val embedding = embeddingService.embed(chunk.text)
        val point = PointStruct.newBuilder()
            .setId(PointId.newBuilder().setUuid(chunk.id).build())
            .setVectors(Vectors.newBuilder().setVector(
                Vector.newBuilder().addAllData(embedding.map { it }).build()
            ))
            .putAllPayload(mapOf(
                "use_case_id" to Value.newBuilder().setStringValue(chunk.useCaseId.value.toString()).build(),
                "chunk_type" to Value.newBuilder().setStringValue(chunk.chunkType.name).build(),
                "text" to Value.newBuilder().setStringValue(chunk.text).build(),
            ))
            .build()
        client.upsertAsync(collectionName, listOf(point)).get()
    }

    override fun search(query: String, limit: Int): List<ScoredChunk> {
        val embedding = embeddingService.embed(query)
        val results = client.searchAsync(
            SearchPoints.newBuilder()
                .setCollectionName(collectionName)
                .addAllVector(embedding.toList())
                .setLimit(limit.toLong())
                .setWithPayload(WithPayloadSelector.newBuilder().setEnable(true).build())
                .build()
        ).get()

        return results.map { point ->
            val chunk = UseCaseChunk(
                id = point.id.uuid,
                useCaseId = UseCaseId.of(point.payloadMap["use_case_id"]!!.stringValue),
                chunkType = ChunkType.valueOf(point.payloadMap["chunk_type"]!!.stringValue),
                text = point.payloadMap["text"]!!.stringValue,
            )
            ScoredChunk(chunk, point.score)
        }
    }

    override fun deleteByUseCaseId(useCaseId: UseCaseId) {
        client.deleteAsync(
            collectionName,
            Filter.newBuilder().addMust(
                Condition.newBuilder().setField(
                    FieldCondition.newBuilder()
                        .setKey("use_case_id")
                        .setMatch(Match.newBuilder().setKeyword(useCaseId.value.toString()).build())
                        .build()
                ).build()
            ).build()
        ).get()
    }
}

@Component
class EmbeddingService(
    @Value("\${anthropic.api-key}") private val apiKey: String,
) {
    fun embed(text: String): FloatArray {
        // Anthropic은 Embedding API 미제공 → OpenAI text-embedding-3-small 또는 로컬 모델 대체
        // 여기선 placeholder: 실제 구현 시 별도 embedding 서비스로 교체
        return FloatArray(1536) { 0f }
    }
}
