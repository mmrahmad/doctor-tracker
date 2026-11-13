import type { Metadata } from 'next';
import { Suspense } from 'react';
import { DoctorDetailView } from '@/features/doctors/components/doctor-detail-view';

export const metadata: Metadata = { title: 'Doctor' };

export default async function DoctorDetailPage({ params }: { params: Promise<{ doctorId: string }> }) {
  const { doctorId } = await params;
  return (
    <Suspense>
      <DoctorDetailView doctorId={doctorId} />
    </Suspense>
  );
}
