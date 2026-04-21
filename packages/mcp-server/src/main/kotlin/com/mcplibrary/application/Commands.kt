package com.mcplibrary.application

data class CreateUseCaseCommand(
    val domain: String,
    val title: String,
    val version: String,
    val scenarios: List<ScenarioInput>,
    val rules: List<RuleInput>,
    val exceptions: List<ExceptionInput> = emptyList(),
)

data class ScenarioInput(val stepOrder: Int, val description: String, val expected: String? = null)
data class RuleInput(val description: String, val constraint: String)
data class ExceptionInput(val condition: String, val handling: String)
