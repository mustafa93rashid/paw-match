import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Plus } from "lucide-react";
import { Button, EmptyState, ErrorState, Pagination, TableSkeleton } from "@paw-match/ui";
import { userManagementHooks } from "../../lib/userManagementHooks";
import { CreateUserDialog } from "./components/CreateUserDialog";
import { UsersFilters } from "./components/UsersFilters";
import type { UsersFiltersValue } from "./components/UsersFilters";
import { UsersTable } from "./components/UsersTable";

const PAGE_SIZE = 10;
const USERS_TABLE_COLUMN_COUNT = 5;

const emptyFilters: UsersFiltersValue = { search: "", role: "", isActive: "" };

const UsersPage = () => {
  const reduceMotion = Boolean(useReducedMotion());
  const usersQuery = userManagementHooks.useAdminUsers();
  const [filters, setFilters] = useState<UsersFiltersValue>(emptyFilters);
  const [page, setPage] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const filteredUsers = useMemo(() => {
    const users = usersQuery.data ?? [];
    const search = filters.search.trim().toLowerCase();

    return users.filter((user) => {
      const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
      const matchesSearch = search.length === 0 || fullName.includes(search) || user.email.toLowerCase().includes(search);
      const matchesRole = filters.role.length === 0 || user.role === filters.role;
      const matchesActive = filters.isActive.length === 0 || String(user.isActive) === filters.isActive;

      return matchesSearch && matchesRole && matchesActive;
    });
  }, [usersQuery.data, filters]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filteredUsers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleFiltersChange = (value: UsersFiltersValue) => {
    setFilters(value);
    setPage(1);
  };

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Users</h1>
          <p className="mt-2 max-w-xl text-slate-600">Manage accounts, roles, and account status platform-wide.</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4" aria-hidden />
          Add user
        </Button>
      </div>

      <div className="mt-6">
        <UsersFilters value={filters} onChange={handleFiltersChange} />
      </div>

      <div className="mt-6">
        {usersQuery.isLoading && <TableSkeleton columns={USERS_TABLE_COLUMN_COUNT} rows={PAGE_SIZE} />}

        {usersQuery.isError && <ErrorState title="Couldn't load users" onRetry={() => usersQuery.refetch()} />}

        {usersQuery.isSuccess && pageItems.length === 0 && (
          <EmptyState
            title="No users match your filters"
            description="Try a different search term or clear the filters above."
          />
        )}

        {usersQuery.isSuccess && pageItems.length > 0 && (
          <>
            <UsersTable users={pageItems} />
            <Pagination page={currentPage} totalPages={totalPages} onPageChange={setPage} className="mt-6" />
          </>
        )}
      </div>

      <CreateUserDialog isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
    </motion.div>
  );
};

export default UsersPage;
