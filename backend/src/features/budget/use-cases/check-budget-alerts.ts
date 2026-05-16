import { pool } from "../../../config/db.js";
import * as repo from "../infrastructure/budget.repository.js";
import * as expenseRepo from "../infrastructure/expense.repository.js";
import { sendNotification } from "../../realtime/use-cases/send-notification.js";

interface AlertCheck {
  budgetId: string;
  userId: string;
}

async function alertAlreadySent(budgetId: string, alertKey: string): Promise<boolean> {
  const { rows } = await pool.query(
    `SELECT 1 FROM budget_alerts WHERE budget_id = $1 AND alert_key = $2 LIMIT 1`,
    [budgetId, alertKey],
  );
  return rows.length > 0;
}

async function recordAlert(budgetId: string, alertKey: string): Promise<void> {
  await pool.query(
    `INSERT INTO budget_alerts (budget_id, alert_key) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
    [budgetId, alertKey],
  );
}

export async function checkBudgetAlerts({ budgetId, userId }: AlertCheck): Promise<void> {
  const budget = await repo.findById(budgetId);
  if (!budget || budget.totalAmount <= 0) return;

  const totalSpent = await expenseRepo.getTotalSpentByBudget(budgetId);
  const spentByCategory = await expenseRepo.getSpentByCategory(budgetId);

  // Check overall budget thresholds
  const totalPercent = (totalSpent / budget.totalAmount) * 100;

  if (totalPercent >= 100) {
    const key = "total:100";
    if (!(await alertAlreadySent(budgetId, key))) {
      await recordAlert(budgetId, key);
      await sendNotification({
        userId,
        type: "budget_alert",
        title: "Budget Exceeded!",
        body: `You've spent ${totalPercent.toFixed(0)}% of your total wedding budget.`,
        metadata: { alertLevel: "exceeded", scope: "total", percent: Math.round(totalPercent) },
      });
    }
  } else if (totalPercent >= 80) {
    const key = "total:80";
    if (!(await alertAlreadySent(budgetId, key))) {
      await recordAlert(budgetId, key);
      await sendNotification({
        userId,
        type: "budget_alert",
        title: "Budget Warning",
        body: `You've used ${totalPercent.toFixed(0)}% of your total wedding budget.`,
        metadata: { alertLevel: "warning", scope: "total", percent: Math.round(totalPercent) },
      });
    }
  }

  // Check per-category thresholds
  const { rows: categoryRows } = await pool.query(
    `SELECT id, name, allocated_amount FROM budget_categories WHERE budget_id = $1 AND allocated_amount > 0`,
    [budgetId],
  );

  const spentMap = new Map<string, number>();
  for (const s of spentByCategory) {
    spentMap.set(s.categoryId, s.totalSpent);
  }

  for (const cat of categoryRows) {
    const allocated = parseFloat(cat.allocated_amount);
    const spent = spentMap.get(cat.id) ?? 0;
    if (allocated <= 0) continue;

    const catPercent = (spent / allocated) * 100;

    if (catPercent >= 100) {
      const key = `cat:${cat.id}:100`;
      if (!(await alertAlreadySent(budgetId, key))) {
        await recordAlert(budgetId, key);
        await sendNotification({
          userId,
          type: "budget_alert",
          title: `"${cat.name}" Over Budget`,
          body: `You've spent ${catPercent.toFixed(0)}% of the allocated amount for ${cat.name}.`,
          metadata: { alertLevel: "exceeded", scope: "category", categoryName: cat.name, percent: Math.round(catPercent) },
        });
      }
    } else if (catPercent >= 80) {
      const key = `cat:${cat.id}:80`;
      if (!(await alertAlreadySent(budgetId, key))) {
        await recordAlert(budgetId, key);
        await sendNotification({
          userId,
          type: "budget_alert",
          title: `"${cat.name}" Nearing Limit`,
          body: `You've used ${catPercent.toFixed(0)}% of the allocated amount for ${cat.name}.`,
          metadata: { alertLevel: "warning", scope: "category", categoryName: cat.name, percent: Math.round(catPercent) },
        });
      }
    }
  }
}
