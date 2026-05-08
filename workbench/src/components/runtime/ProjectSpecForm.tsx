import { GATE_OPTIONS, type GateName, type ProjectSpec } from "../../lib/knot/types";

interface ProjectSpecFormProps {
  spec: ProjectSpec;
  readOnly: boolean;
  onChange: (spec: ProjectSpec) => void;
}

function splitCsv(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function ProjectSpecForm({ spec, readOnly, onChange }: ProjectSpecFormProps) {
  return (
    <section className="runtime-panel spec-form">
      <div className="panel-heading">
        <h2>项目规格</h2>
        <span>{spec.project_id}</span>
      </div>

      <div className="form-grid">
        <label>
          项目 ID
          <input
            value={spec.project_id}
            disabled={readOnly}
            onChange={(event) => onChange({ ...spec, project_id: event.currentTarget.value })}
          />
        </label>
        <label>
          项目类型
          <input
            value={spec.project_type}
            disabled={readOnly}
            onChange={(event) => onChange({ ...spec, project_type: event.currentTarget.value })}
          />
        </label>
        <label>
          目标媒介
          <input
            value={spec.target_medium}
            disabled={readOnly}
            onChange={(event) => onChange({ ...spec, target_medium: event.currentTarget.value })}
          />
        </label>
        <label>
          语言
          <input
            value={spec.language}
            disabled={readOnly}
            onChange={(event) => onChange({ ...spec, language: event.currentTarget.value })}
          />
        </label>
        <label>
          受众
          <input
            value={spec.audience}
            disabled={readOnly}
            onChange={(event) => onChange({ ...spec, audience: event.currentTarget.value })}
          />
        </label>
        <label>
          阶段
          <input
            value={spec.workflow.stages.join(", ")}
            disabled={readOnly}
            onChange={(event) =>
              onChange({
                ...spec,
                workflow: { ...spec.workflow, stages: splitCsv(event.currentTarget.value) },
              })
            }
          />
        </label>
        <label>
          输出根目录
          <input
            value={spec.workflow.artifact_root}
            disabled={readOnly}
            onChange={(event) =>
              onChange({
                ...spec,
                workflow: { ...spec.workflow, artifact_root: event.currentTarget.value },
              })
            }
          />
        </label>
        <label>
          内容单元前缀
          <input
            value={spec.naming.story_prefix}
            disabled={readOnly}
            onChange={(event) =>
              onChange({
                ...spec,
                naming: { ...spec.naming, story_prefix: event.currentTarget.value },
              })
            }
          />
        </label>
      </div>

      <div className="gate-chip-row">
        {GATE_OPTIONS.map((gate) => (
          <label key={gate}>
            <input
              type="checkbox"
              disabled={readOnly}
              checked={spec.review_policy.required_gates.includes(gate)}
              onChange={() => {
                const gates = spec.review_policy.required_gates.includes(gate)
                  ? spec.review_policy.required_gates.filter((item) => item !== gate)
                  : [...spec.review_policy.required_gates, gate as GateName];
                onChange({
                  ...spec,
                  review_policy: { ...spec.review_policy, required_gates: gates },
                });
              }}
            />
            {gate}
          </label>
        ))}
      </div>
    </section>
  );
}
