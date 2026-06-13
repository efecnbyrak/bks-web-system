export type ActionResult<T = undefined> = T extends undefined
    ? { success: boolean; error?: string; message?: string }
    : { success: boolean; error?: string; message?: string; data?: T };

export type ActionVoidResult = ActionResult<undefined>;
