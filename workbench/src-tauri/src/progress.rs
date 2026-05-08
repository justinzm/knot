use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
pub struct ProgressEntry {
    pub title: String,
    pub kind: String,
    pub status: String,
    pub body: String,
}

pub fn parse_progress(content: &str) -> Vec<ProgressEntry> {
    content
        .split("\n---")
        .filter_map(|chunk| {
            let trimmed = chunk.trim();
            if trimmed.is_empty() || trimmed.starts_with("# Knot Progress Log") {
                return None;
            }
            let title = trimmed.lines().next().unwrap_or("记录").trim().to_string();
            let body = trimmed.lines().skip(1).collect::<Vec<_>>().join("\n");
            Some(ProgressEntry {
                kind: entry_kind(&title, &body),
                status: entry_status(&body),
                title,
                body,
            })
        })
        .collect()
}

fn entry_kind(title: &str, body: &str) -> String {
    if title.contains("PRECHECK") || body.contains("PRECHECK") {
        "PRECHECK".to_string()
    } else if body.contains("Story") || body.contains("story") {
        "STORY".to_string()
    } else {
        "LOG".to_string()
    }
}

fn entry_status(body: &str) -> String {
    body.lines()
        .find_map(|line| line.trim().strip_prefix("- Status:"))
        .map(str::trim)
        .unwrap_or("unknown")
        .to_string()
}

#[cfg(test)]
mod tests {
    use super::parse_progress;

    #[test]
    fn parses_precheck_entries() {
        let entries = parse_progress("## [now] - PRECHECK\n- Status: pass\n---");

        assert_eq!(entries[0].kind, "PRECHECK");
        assert_eq!(entries[0].status, "pass");
    }
}
