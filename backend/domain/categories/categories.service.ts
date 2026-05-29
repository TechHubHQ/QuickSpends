import { getDB } from "../../db/engine";
import { Category } from "../types";

export const getCategories = async (): Promise<Category[]> => {
    const db = await getDB();
    return db.getAllAsync<Category>("SELECT * FROM categories ORDER BY type ASC, name ASC;");
};

export const createCategory = async (category: Omit<Category, "id">): Promise<number> => {
    const db = await getDB();
    const result = await db.runAsync(
        "INSERT INTO categories (name, parent_id, type) VALUES (?, ?, ?);",
        [category.name, category.parent_id, category.type]
    );
    return result.lastInsertRowId;
};

export const deleteCategory = async (id: number): Promise<void> => {
    const db = await getDB();
    await db.runAsync("DELETE FROM categories WHERE id = ?;", [id]);
};
