
# Warehouse Edge - Advanced Warehouse Management System

This project is an advanced Warehouse Management System (WMS) built with Next.js, React, ShadCN UI, Tailwind CSS, and Genkit for AI-powered features. It provides a comprehensive suite of tools for managing products, inventory, material requests, and generating insightful reports.

---

## Overview

Warehouse Edge aims to simplify and automate warehouse operations for manufacturing and sales companies. The system supports bulk data import/export, multi-level inventory tracking, role-based access control (simulated), and a user-friendly interface for managing daily warehouse tasks.

---

## Key Features Implemented (Frontend Simulation)

*   **Dashboard (`/`):**
    *   Overview of key metrics: Total Products, Low Stock Alerts, Pending Material Requests, Recent Inventory Movements.
    *   Quick actions to navigate to different modules.
    *   Recent stock movements and material requests at a glance.
    *   Simulation of CMS sales and Bill of Materials (BOM) deduction.
    *   Display of items needing reorder.

*   **Product Management (`/products`):**
    *   View a list of all products with details like SKU, category, warehouse, quantity, and status.
    *   Filter products by name/SKU, category, status, and warehouse.
    *   **Add, Edit, and View Product Details:** Modal-based forms for managing product information.
    *   **Bulk Import Products (CSV):** Upload a CSV file to add or update products.
    *   **Bulk Update Inventory (CSV):** Upload a CSV file to update stock quantities and reorder levels.
    *   **Product Status Management:** Update product status (Available, Low Stock, Out of Stock, Damaged) with an optional AI-powered explanation for the status.
    *   Role-based access: Admins/Warehouse Managers have full control; Department Employees have limited view/update access based on their assigned category.

*   **Inventory Ledger (`/inventory`):**
    *   Track all stock movements, adjustments, and transactions.
    *   Filter transactions by date range, product, transaction type, warehouse, and user/system.
    *   **AI-Powered Variance Explainer:** A modal to help explain inventory discrepancies using Genkit.

*   **Material Requests (`/material-requests`):**
    *   Department Employees can submit requests for materials.
    *   Admins/Warehouse Managers can approve or reject requests.
    *   Track the status of requests (Pending, Approved, Rejected, Completed, Cancelled).
    *   View request history with details of approver actions and dates.
    *   Filter requests by submission date, status, requester, and department.
    *   Summary cards for request statuses.

*   **Reports (`/reports`):**
    *   View inventory movement summaries: Total Damaged, Returned, Inflow, Outflow.
    *   Filter reports by date range, warehouse, category, and product.
    *   **Product Movement Breakdown:** Detailed table showing inflow, outflow, damage, return, and net change per product.
    *   **Export to CSV:** Export the product movement breakdown.
    *   **Low Stock / Reorder Needed Report:** Lists products below their reorder level.
    *   **Visual Charts:**
        *   Bar chart: Product Inflow vs. Outflow.
        *   Pie chart: Transaction Type Distribution.

*   **Settings (`/settings`):**
    *   **General Settings:** Application name, theme (Light/Dark mode toggle).
    *   **User & Role Management (Simulated):**
        *   View system roles (Admin, WarehouseManager, DepartmentEmployee) and their expected permissions.
        *   Add new users (simulated, client-side only).
        *   Change roles for existing users (simulated, client-side only).
    *   **Category Management (Simulated):** View and add new product categories.
    *   **Warehouse Management (Simulated):** View, add, and edit warehouse locations.
    *   **Integrations & BOM (Conceptual):** Information and placeholders for CMS integration and Bill of Materials management.
    *   **Notifications (Conceptual):** Information and placeholders for configuring inventory alert notifications.
    *   **Language Settings (Conceptual):** Placeholder for multi-language support.

*   **Role-Based Access Control (RBAC) - Simulated:**
    *   The application simulates different user roles (Admin, Warehouse Manager, Department Employee).
    *   Access to features and data is restricted based on the logged-in user's role.
    *   User switching mechanism available in the sidebar for testing different roles.

*   **UI & UX:**
    *   Responsive design using ShadCN UI components and Tailwind CSS.
    *   Collapsible sidebar for navigation.
    *   Toast notifications for user feedback.
    *   Modals for data entry and actions.
    *   Client-side date formatting to prevent hydration errors.

---

## Tech Stack

*   **Frontend:** Next.js (App Router), React, TypeScript
*   **UI:** ShadCN UI, Tailwind CSS
*   **State Management:** React Context API (for Auth, Sidebar)
*   **AI Integration:** Genkit (for product status explanation, variance explanation)
*   **Data Handling (Client-side):**
    *   `papaparse` for CSV processing.
    *   `date-fns` for date formatting.
    *   `recharts` for charts.
*   **Forms:** `react-hook-form` with `zod` for validation.
*   **Icons:** `lucide-react`

---

## Getting Started

### Prerequisites

*   Node.js (version 20.x or higher recommended)
*   npm or yarn

### Installation & Running

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd warehouse-edge
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the root of the project. If any API keys are needed for Genkit (e.g., Google AI), add them here.
    ```
    # Example for Google AI
    # GOOGLE_API_KEY=YOUR_GOOGLE_API_KEY
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:9002`.

5.  **(Optional) Run Genkit development server (for AI features):**
    If you are actively developing AI flows, you might need to run the Genkit development server in a separate terminal:
    ```bash
    npm run genkit:dev
    ```

### Build and Start for Production

1.  **Build the application:**
    ```bash
    npm run build
    ```

2.  **Start the production server:**
    ```bash
    npm run start
    ```

---

## Folder Structure (Key Directories)

```
.
├── src/
│   ├── ai/                 # Genkit AI flows and configuration
│   │   ├── flows/
│   │   └── genkit.ts
│   ├── app/                # Next.js App Router pages
│   │   ├── (page-name)/page.tsx
│   │   └── layout.tsx
│   │   └── globals.css
│   ├── components/         # UI components
│   │   ├── common/         # Reusable common components
│   │   ├── layout/         # Layout components (AppShell, etc.)
│   │   ├── (feature-specific)/ # Components for specific features
│   │   └── ui/             # ShadCN UI components
│   ├── contexts/           # React Context providers (e.g., AuthContext)
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility functions, constants, types
│   │   ├── constants.ts
│   │   ├── types.ts
│   │   └── utils.ts
│   └── ...
├── public/                 # Static assets
├── .env                    # Environment variables (gitignored)
├── next.config.ts          # Next.js configuration
├── package.json
├── tailwind.config.ts      # Tailwind CSS configuration
└── tsconfig.json           # TypeScript configuration
```

---

## Current Limitations

*   **Frontend Simulation:** Most features, especially those related to data persistence (saving products, users, requests), RBAC enforcement, and actual CMS/Notification integration, are simulated on the client-side using mock data.
*   **No Persistent Storage:** Data added or modified during a session is not saved and will be lost upon refreshing the browser. A proper backend and database are required for persistence.
*   **Genkit Configuration:** Assumes Genkit is configured with necessary API keys (e.g., for Google AI) in the `.env` file for AI features to work.
*   **Excel Import:** The "Import from Excel" feature currently supports `.csv` files due to the complexity of handling `.xlsx` on the client-side.

---

## How to Use Simulated Features

*   **Change User Role:** In the sidebar, click on the user avatar at the bottom. A dropdown menu will appear allowing you to "Switch User (Dev)" to test different roles (Admin, WarehouseManager, DepartmentEmployee) and their respective permissions.
*   **Add/Edit Data:** Features like adding new products, categories, warehouses, or material requests will update the application's state for the current session but will not persist.

---

## Original Concept & Contact

This Warehouse Management System concept was prepared by **Mohammad Babaei**.

For inquiries regarding the development of a production-ready version or custom features, please contact:
**AdsChi.com** ([https://adschicrm.com/](https://adschicrm.com/))

---

This README provides a snapshot of the project's current state.
```
