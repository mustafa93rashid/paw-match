import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { EmptyState, ErrorState, Pagination, TableSkeleton } from "@paw-match/ui";
import type { VetAppointmentStatus } from "@paw-match/types";
import { vetAppointmentVetHooks } from "../../lib/vetAppointmentVetHooks";
import { AppointmentsFilters } from "./components/AppointmentsFilters";
import type { AppointmentsFiltersValue } from "./components/AppointmentsFilters";
import { AppointmentsTable } from "./components/AppointmentsTable";

const PAGE_SIZE = 10;
const APPOINTMENTS_TABLE_COLUMN_COUNT = 5;

const emptyFilters: AppointmentsFiltersValue = { search: "", status: "" };

const AppointmentsPage = () => {
  const reduceMotion = Boolean(useReducedMotion());
  const [filters, setFilters] = useState<AppointmentsFiltersValue>(emptyFilters);
  const [page, setPage] = useState(1);

  const appointmentsQuery = vetAppointmentVetHooks.useVetAppointments(
    filters.status ? { status: filters.status as VetAppointmentStatus } : {},
  );

  const filteredAppointments = useMemo(() => {
    const appointments = appointmentsQuery.data ?? [];
    const search = filters.search.trim().toLowerCase();

    if (search.length === 0) return appointments;

    return appointments.filter((appointment) => {
      if (!appointment.adopterId) return false;
      const adopterName = `${appointment.adopterId.firstName} ${appointment.adopterId.lastName}`.toLowerCase();
      return adopterName.includes(search) || appointment.adopterId.email.toLowerCase().includes(search);
    });
  }, [appointmentsQuery.data, filters.search]);

  const totalPages = Math.max(1, Math.ceil(filteredAppointments.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filteredAppointments.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleFiltersChange = (value: AppointmentsFiltersValue) => {
    setFilters(value);
    setPage(1);
  };

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Appointments</h1>
      <p className="mt-2 max-w-xl text-slate-600">Schedule requests and manage upcoming consultations.</p>

      <div className="mt-6">
        <AppointmentsFilters value={filters} onChange={handleFiltersChange} />
      </div>

      <div className="mt-6">
        {appointmentsQuery.isLoading && <TableSkeleton columns={APPOINTMENTS_TABLE_COLUMN_COUNT} rows={PAGE_SIZE} />}

        {appointmentsQuery.isError && (
          <ErrorState title="Couldn't load appointments" onRetry={() => appointmentsQuery.refetch()} />
        )}

        {appointmentsQuery.isSuccess && pageItems.length === 0 && (
          <EmptyState
            title="No appointments match your filters"
            description="Try a different search term or clear the filters above."
          />
        )}

        {appointmentsQuery.isSuccess && pageItems.length > 0 && (
          <>
            <AppointmentsTable appointments={pageItems} />
            <Pagination page={currentPage} totalPages={totalPages} onPageChange={setPage} className="mt-6" />
          </>
        )}
      </div>
    </motion.div>
  );
};

export default AppointmentsPage;
