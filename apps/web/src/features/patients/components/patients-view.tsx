'use client';

import { Plus } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { PatientDirectory } from './patient-directory';
import { PatientFormDialog } from './patient-form-dialog';

export function PatientsView() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const addPatientButton = (
    <Button onClick={() => setIsAddDialogOpen(true)}>
      <Plus />
      Add patient
    </Button>
  );

  return (
    <>
      <PageHeader
        title="Patients"
        description="Search, filter and update every patient across your doctors."
        actions={addPatientButton}
      />
      <Card className="overflow-hidden">
        <PatientDirectory emptyAction={addPatientButton} />
      </Card>
      <PatientFormDialog key={String(isAddDialogOpen)} open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} />
    </>
  );
}
