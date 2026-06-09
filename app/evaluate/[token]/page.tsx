import { redirect } from "next/navigation";
import { EmptyState } from "@/components/EmptyState";
import { competencyLabels, relationTypeLabels } from "@/lib/formatters";
import {
  buildScoresFromFormData,
  getEvaluationFormByToken,
  submitEvaluationForToken,
  type EvaluationSubmitStatus,
} from "@/lib/queries";

export const dynamic = "force-dynamic";

type EvaluateTokenPageProps = {
  params: Promise<{
    token: string;
  }>;
  searchParams: Promise<{
    result?: EvaluationSubmitStatus;
  }>;
};

async function submitEvaluationAction(formData: FormData) {
  "use server";

  const tokenValue = formData.get("token");
  const token = typeof tokenValue === "string" ? tokenValue : "";
  const commentValue = formData.get("anonymousComment");
  const anonymousComment =
    typeof commentValue === "string" ? commentValue : "";
  const scores = buildScoresFromFormData(formData);

  const result = await submitEvaluationForToken(token, scores, anonymousComment);

  if (!token) {
    redirect("/evaluate?result=invalid-token");
  }

  redirect(`/evaluate/${encodeURIComponent(token)}?result=${result.status}`);
}

function ResultMessage({ result }: { result?: EvaluationSubmitStatus }) {
  if (!result) {
    return null;
  }

  const messages: Record<EvaluationSubmitStatus, string> = {
    "already-completed": "Esta evaluación ya fue enviada anteriormente.",
    "invalid-scores": "Las puntuaciones deben estar entre 1 y 5.",
    "invalid-token": "El token no existe o no es válido.",
    submitted: "Evaluación enviada correctamente.",
  };

  return (
    <section className="section info-panel">
      <p>{messages[result]}</p>
    </section>
  );
}

export default async function EvaluateTokenPage({
  params,
  searchParams,
}: EvaluateTokenPageProps) {
  const { token } = await params;
  const { result } = await searchParams;
  const formData = await getEvaluationFormByToken(token);

  if (!formData) {
    return (
      <main className="page">
        <section className="page-header">
          <h1>Token inválido</h1>
          <p>No fue posible encontrar una asignación para este token.</p>
        </section>
        <ResultMessage result={result} />
        <EmptyState
          message="Revise la lista de tokens de demostración en /evaluate."
          title="Asignación no encontrada"
        />
      </main>
    );
  }

  const isCompleted = formData.status === "completed";

  return (
    <main className="page">
      <section className="page-header">
        <h1>Formulario de evaluación 360</h1>
        <p>
          Evalúa a {formData.evaluated.fullName}. La aplicación no muestra el
          nombre del evaluador y la colección evaluations no almacena
          evaluatorId.
        </p>
      </section>

      <ResultMessage result={result} />

      <section className="section info-panel">
        <p>
          <strong>Empleado evaluado:</strong> {formData.evaluated.fullName}
        </p>
        <p>
          <strong>Departamento:</strong> {formData.evaluated.department}
        </p>
        <p>
          <strong>Puesto:</strong> {formData.evaluated.position}
        </p>
        <p>
          <strong>Tipo de relación:</strong>{" "}
          {relationTypeLabels[formData.relationType]}
        </p>
      </section>

      {isCompleted ? (
        <section className="section">
          <EmptyState
            message="El token queda bloqueado para evitar duplicar evaluaciones."
            title="Evaluación ya enviada"
          />
        </section>
      ) : (
        <form action={submitEvaluationAction} className="form section">
          <input name="token" type="hidden" value={formData.token} />

          {formData.cycle.competencies.map((competency) => (
            <div className="form-row" key={competency.key}>
              <label htmlFor={competency.key}>
                {competencyLabels[competency.key]}
              </label>
              <small>{competency.description}</small>
              <select
                defaultValue="4"
                id={competency.key}
                name={competency.key}
                required
              >
                <option value="5">5 - Excelente</option>
                <option value="4">4 - Bueno</option>
                <option value="3">3 - Aceptable</option>
                <option value="2">2 - Necesita mejorar</option>
                <option value="1">1 - Deficiente</option>
              </select>
            </div>
          ))}

          <div className="form-row">
            <label htmlFor="anonymousComment">Comentario anónimo</label>
            <textarea
              id="anonymousComment"
              name="anonymousComment"
              placeholder="Comentario cualitativo opcional"
            />
          </div>

          <button className="button" type="submit">
            Enviar evaluación
          </button>
        </form>
      )}
    </main>
  );
}
