import { Button } from "@/components/ui/button";
import { IconChevronLeft, IconChevronRight, IconChevronsLeft, IconChevronsRight } from "@tabler/icons-react";

interface PaginationControlsProps {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
}

export function PaginationControls({ page, pageCount, onPageChange }: PaginationControlsProps) {
  return (
    <div className="flex items-center justify-between mt-4">
      <span className="text-sm text-muted-foreground">
        Strona {page + 1} z {pageCount}
      </span>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => onPageChange(0)} disabled={page === 0}>
          <IconChevronsLeft />
        </Button>
        <Button variant="outline" size="sm" onClick={() => onPageChange(page - 1)} disabled={page === 0}>
          <IconChevronLeft />
        </Button>
        <Button variant="outline" size="sm" onClick={() => onPageChange(page + 1)} disabled={page >= pageCount - 1}>
          <IconChevronRight />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(pageCount - 1)}
          disabled={page >= pageCount - 1}
        >
          <IconChevronsRight />
        </Button>
      </div>
    </div>
  );
}