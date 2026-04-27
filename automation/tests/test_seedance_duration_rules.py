import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[3]


def read_text(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


class SeedanceDurationRulesTests(unittest.TestCase):
    def test_claude_flow_defines_episode_duration_defaults_and_gate(self) -> None:
        content = read_text(".claude/CLAUDE.md")

        self.assertIn("episode_target_duration_seconds", content)
        self.assertIn("episode_duration_tolerance_seconds", content)
        self.assertIn("60", content)
        self.assertIn("±4", content)
        self.assertIn("56-64 秒", content)

    def test_director_skill_requires_episode_level_duration_budgeting(self) -> None:
        content = read_text(".claude/skills/director-skill/SKILL.md")

        self.assertIn("目标总时长", content)
        self.assertIn("默认目标整集 60 秒", content)
        self.assertIn("优先 7 条", content)
        self.assertIn("可否合并", content)

    def test_storyboard_rules_define_total_duration_metadata(self) -> None:
        skill = read_text(".claude/skills/seedance-storyboard-skill/SKILL.md")
        rules = read_text(".claude/skills/seedance-storyboard-skill/video-prompt-json-rules.md")
        template = read_text(".claude/skills/seedance-storyboard-skill/templates/seedance-prompts-template.md")

        for content in (skill, rules, template):
            self.assertIn("actual_total_duration_seconds", content)
            self.assertIn("duration_status", content)

    def test_review_skill_marks_total_duration_out_of_range_as_fail(self) -> None:
        content = read_text(".claude/skills/seedance-prompt-review-skill/SKILL.md")

        self.assertIn("episode_duration_within_target", content)
        self.assertIn("总时长在 `56-64 秒`", content)
        self.assertIn("duration_review", content)
        self.assertIn("总时长超出目标", content)


if __name__ == "__main__":
    unittest.main()
