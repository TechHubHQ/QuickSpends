import { getDB } from "../../db/engine";
import { Investment } from "../types";

export const getInvestments = async (): Promise<Investment[]> => {
    const db = await getDB();
    return db.getAllAsync<Investment>("SELECT * FROM investments ORDER BY current_value DESC;");
};

export const createInvestment = async (investment: Omit<Investment, "id" | "created_at">): Promise<number> => {
    const db = await getDB();
    const result = await db.runAsync(
        "INSERT INTO investments (name, type, invested_amount, current_value) VALUES (?, ?, ?, ?);",
        [investment.name, investment.type, investment.invested_amount, investment.current_value]
    );
    return result.lastInsertRowId;
};

export const updateInvestmentValue = async (id: number, currentValue: number): Promise<void> => {
    const db = await getDB();
    await db.runAsync("UPDATE investments SET current_value = ? WHERE id = ?;", [currentValue, id]);
};

export const deleteInvestment = async (id: number): Promise<void> => {
    const db = await getDB();
    await db.runAsync("DELETE FROM investments WHERE id = ?;", [id]);
};
