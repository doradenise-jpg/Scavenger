output "spot_capacity_provider_name" {
  value = aws_ecs_capacity_provider.spot.name
}

output "budget_name" {
  value = aws_budgets_budget.monthly.name
}
