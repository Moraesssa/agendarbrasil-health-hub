
import { Skeleton } from "@/components/ui/skeleton";

const AppointmentSkeleton = () => (
  <div className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-gradient-to-r from-white to-blue-50 border border-blue-100">
    <Skeleton className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex-shrink-0" />
    
    <div className="flex-1 min-w-0 space-y-2">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-3 w-20" />
      
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 my-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-12" />
      </div>
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
        <Skeleton className="h-5 w-20" />
        <div className="flex gap-2">
          <Skeleton className="h-7 w-16" />
          <Skeleton className="h-7 w-12" />
          <Skeleton className="h-7 w-16" />
        </div>
      </div>
    </div>
  </div>
);

export default AppointmentSkeleton;
