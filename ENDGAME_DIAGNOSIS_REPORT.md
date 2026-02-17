# Endgame Diagnosis: Why The Apps Are "Broken"

You asked for the actual reason behind the "Something went wrong" (Storefront) and Blank Page (Admin) issues.
**Root Cause:** It is NOT a server crash. It is a **Data Structure Mismatch** between Backend and Frontend.

---

## 1. Storefront Crash ("Something went wrong")

**Location:** [`storefront/src/lib/api.ts`](storefront/src/lib/api.ts) vs [`backend/src/routes/collections.ts`](backend/src/routes/collections.ts)

**The Logic Flaw:**

1.  **Backend** sends data wrapped in a "Success" envelope:
    ```json
    {
      "success": true,
      "data": [ { "id": 1, "title": "Summer" }, ... ]
    }
    ```
2.  **Frontend API** (`getCollections`) returns the raw JSON:
    ```typescript
    // api.ts line 100
    return res.json(); // Returns the whole object { success: true, data: [...] }
    ```
3.  **Frontend Component** expects `collections` to be at the top level:
    ```typescript
    const { collections } = await api.getCollections();
    // collections is UNDEFINED because it's inside 'data'!
    ```
4.  **Result:** Component tries `collections.map(...)` → **CRASH** ("Cannot read properties of undefined").

**Fix Required:** Update `storefront/src/lib/api.ts` to unwrap the data (return `json.data`).

---

## 2. Admin Panel (Blank / "Loading...")

**Location:** [`admin/src/context/auth-context.tsx`](admin/src/context/auth-context.tsx:43)

**The Logic Flaw:**

1.  **Frontend API** (`api.getMe`) _already unwraps_ the data:
    ```typescript
    // api.ts line 585
    return response.data; // Returns { user: ... }
    ```
2.  **Auth Provider** tries to unwrap it _AGAIN_:
    ```typescript
    // auth-context.tsx line 43
    if (data?.data?.user) { ... }
    ```
3.  **The Bug:** `data` is `{ user: ... }`. So `data.data` is `undefined`.
4.  **Result:** The app thinks you are NOT logged in, but fails to redirect or update state properly, leaving you on a blank/loading screen (or infinitely trying to auth).

**Fix Required:** Change `data?.data?.user` to `data?.user` in `auth-context.tsx`.

---

## Conclusion

The servers are running perfectly. The code running inside the browser is crashing because it's misinterpreting the data sent by the server.

**Recommended Action:**
Proceed to fix these specific lines in `storefront/src/lib/api.ts` and `admin/src/context/auth-context.tsx`.
