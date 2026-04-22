package com.mcplibrary.presentation

import com.mcplibrary.application.*
import com.mcplibrary.domain.usecase.UseCase
import com.mcplibrary.domain.usecase.UseCaseId
import com.mcplibrary.application.UseCaseNotFoundException
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import org.springframework.web.bind.annotation.ExceptionHandler
import java.time.Instant
import java.util.UUID

@RestController
@RequestMapping("/usecases")
class UseCaseController(
    private val useCaseService: UseCaseService,
) {
    @GetMapping
    fun list(): List<UseCaseResponse> =
        useCaseService.getAll().map { it.toResponse() }

    @GetMapping("/{id}")
    fun get(@PathVariable id: UUID): UseCaseResponse =
        useCaseService.getById(UseCaseId.of(id.toString())).toResponse()

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun create(@RequestBody body: CreateUseCaseRequest): Map<String, String> {
        val id = useCaseService.create(body.toCommand())
        return mapOf("id" to id.value.toString())
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun delete(@PathVariable id: UUID) =
        useCaseService.delete(UseCaseId.of(id.toString()))

    @ExceptionHandler(UseCaseNotFoundException::class)
    fun handleNotFound(e: UseCaseNotFoundException) =
        ResponseEntity.notFound().build<Unit>()

    @ExceptionHandler(IllegalArgumentException::class)
    fun handleBadRequest(e: IllegalArgumentException) =
        ResponseEntity.badRequest().body(mapOf("error" to e.message))
}

@RestController
class SearchController(
    private val useCaseService: UseCaseService,
    private val llmService: LlmService,
) {
    @PostMapping("/search")
    fun search(@RequestBody body: SearchRequest): SearchResponse {
        val results = useCaseService.search(body.query, body.limit ?: 10)
        return SearchResponse(useCases = results.map { it.toResponse() }, total = results.size, query = body.query)
    }

    @PostMapping("/query")
    fun query(@RequestBody body: QueryRequest): QueryResponse {
        val relevantUseCases = useCaseService.search(body.query, 5)
        val answer = llmService.answer(body.query, relevantUseCases)
        return QueryResponse(answer = answer, usedUseCases = relevantUseCases.map { it.toResponse() })
    }
}

data class CreateUseCaseRequest(
    val domain: String,
    val title: String,
    val version: String = "1.0.0",
    val scenarios: List<ScenarioRequest>,
    val rules: List<RuleRequest>,
    val exceptions: List<ExceptionRequest> = emptyList(),
) {
    fun toCommand() = CreateUseCaseCommand(
        domain = domain,
        title = title,
        version = version,
        scenarios = scenarios.map { ScenarioInput(it.stepOrder, it.description, it.expected) },
        rules = rules.map { RuleInput(it.description, it.constraint) },
        exceptions = exceptions.map { ExceptionInput(it.condition, it.handling) },
    )
}

data class ScenarioRequest(val stepOrder: Int, val description: String, val expected: String? = null)
data class RuleRequest(val description: String, val constraint: String)
data class ExceptionRequest(val condition: String, val handling: String)
data class SearchRequest(val query: String, val limit: Int? = null)
data class QueryRequest(val query: String)

data class UseCaseResponse(
    val id: String, val domain: String, val title: String, val version: String,
    val scenarios: List<ScenarioResponse>, val rules: List<RuleResponse>,
    val exceptions: List<ExceptionResponse>, val createdAt: Instant, val updatedAt: Instant,
)

data class ScenarioResponse(val id: String, val stepOrder: Int, val description: String, val expected: String?)
data class RuleResponse(val id: String, val description: String, val constraint: String)
data class ExceptionResponse(val id: String, val condition: String, val handling: String)
data class SearchResponse(val useCases: List<UseCaseResponse>, val total: Int, val query: String)
data class QueryResponse(val answer: String, val usedUseCases: List<UseCaseResponse>)

fun UseCase.toResponse() = UseCaseResponse(
    id = id.value.toString(),
    domain = domain.value,
    title = title.value,
    version = version.value,
    scenarios = scenarios().items().map { ScenarioResponse(it.id.toString(), it.stepOrder, it.description, it.expected) },
    rules = rules().items().map { RuleResponse(it.id.toString(), it.description, it.constraint) },
    exceptions = exceptions().items().map { ExceptionResponse(it.id.toString(), it.condition, it.handling) },
    createdAt = createdAt,
    updatedAt = updatedAt(),
)
