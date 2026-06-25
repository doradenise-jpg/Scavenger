use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValidationError {
    pub field: String,
    pub message: String,
}

pub fn validate_required(value: &str, field: &str) -> Option<ValidationError> {
    if value.trim().is_empty() {
        Some(ValidationError {
            field: field.to_string(),
            message: format!("{} is required", field),
        })
    } else {
        None
    }
}

pub fn validate_min_length(value: &str, field: &str, min: usize) -> Option<ValidationError> {
    if value.len() < min {
        Some(ValidationError {
            field: field.to_string(),
            message: format!("{} must be at least {} characters", field, min),
        })
    } else {
        None
    }
}

pub fn validate_range(value: u64, field: &str, min: u64, max: u64) -> Option<ValidationError> {
    if value < min || value > max {
        Some(ValidationError {
            field: field.to_string(),
            message: format!("{} must be between {} and {}", field, min, max),
        })
    } else {
        None
    }
}

pub fn validate_pagination(page: u32, limit: u32) -> Vec<ValidationError> {
    let mut errors = Vec::new();
    if page == 0 {
        errors.push(ValidationError {
            field: "page".to_string(),
            message: "page must be at least 1".to_string(),
        });
    }
    if limit == 0 || limit > 100 {
        errors.push(ValidationError {
            field: "limit".to_string(),
            message: "limit must be between 1 and 100".to_string(),
        });
    }
    errors
}

pub fn validate_email(email: &str) -> Option<ValidationError> {
    if !email.contains('@') || !email.contains('.') {
        Some(ValidationError {
            field: "email".to_string(),
            message: "invalid email format".to_string(),
        })
    } else {
        None
    }
}

pub fn validate_export_format(format: &str) -> Option<ValidationError> {
    match format.to_lowercase().as_str() {
        "csv" | "json" | "pdf" => None,
        _ => Some(ValidationError {
            field: "format".to_string(),
            message: "format must be csv, json, or pdf".to_string(),
        }),
    }
}

pub fn validate_date_range(start: &str, end: &str) -> Vec<ValidationError> {
    let mut errors = Vec::new();
    if chrono::NaiveDateTime::parse_from_str(start, "%Y-%m-%dT%H:%M:%S").is_err() {
        errors.push(ValidationError {
            field: "start_date".to_string(),
            message: "invalid start_date format, use YYYY-MM-DDTHH:MM:SS".to_string(),
        });
    }
    if chrono::NaiveDateTime::parse_from_str(end, "%Y-%m-%dT%H:%M:%S").is_err() {
        errors.push(ValidationError {
            field: "end_date".to_string(),
            message: "invalid end_date format, use YYYY-MM-DDTHH:MM:SS".to_string(),
        });
    }
    errors
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_validate_required() {
        assert!(validate_required("", "name").is_some());
        assert!(validate_required("valid", "name").is_none());
    }

    #[test]
    fn test_validate_min_length() {
        assert!(validate_min_length("ab", "name", 3).is_some());
        assert!(validate_min_length("abc", "name", 3).is_none());
    }

    #[test]
    fn test_validate_range() {
        assert!(validate_range(5, "value", 10, 100).is_some());
        assert!(validate_range(50, "value", 10, 100).is_none());
    }

    #[test]
    fn test_validate_pagination() {
        assert!(!validate_pagination(0, 10).is_empty());
        assert!(!validate_pagination(1, 0).is_empty());
        assert!(!validate_pagination(1, 200).is_empty());
        assert!(validate_pagination(1, 10).is_empty());
    }

    #[test]
    fn test_validate_email() {
        assert!(validate_email("invalid").is_some());
        assert!(validate_email("test@example.com").is_none());
    }

    #[test]
    fn test_validate_export_format() {
        assert!(validate_export_format("csv").is_none());
        assert!(validate_export_format("json").is_none());
        assert!(validate_export_format("pdf").is_none());
        assert!(validate_export_format("xls").is_some());
    }
}
