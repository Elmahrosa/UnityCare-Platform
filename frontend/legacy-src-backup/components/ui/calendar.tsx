import * as React from "react";
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        "bg-background group/calendar p-3",
        className
      )}
      classNames={{
        months: "flex gap-4 flex-col md:flex-row relative",
        month: "flex flex-col w-full gap-4",
        nav: "flex items-center gap-1 w-full absolute top-0 inset-x-0 justify-between",
        nav_button: cn(
          buttonVariants({ variant: "ghost" }),
          "size-7 aria-disabled:opacity-50 p-0 select-none"
        ),
        nav_button_previous: "absolute start-1",
        nav_button_next: "absolute end-1",
        caption: "flex items-center justify-center h-9 w-full px-7",
        caption_label: "select-none font-medium text-sm",
        caption_dropdowns: "w-full flex items-center text-sm font-medium justify-center h-9 gap-1.5",
        dropdown_month: "relative has-focus:border-ring border border-input shadow-xs rounded-md",
        dropdown: "absolute bg-popover inset-0 opacity-0",
        table: "w-full border-collapse",
        head_row: "flex",
        head_cell: "text-muted-foreground rounded-md flex-1 font-normal text-[0.8rem] select-none",
        row: "flex w-full mt-2",
        cell: "relative w-full h-full p-0 text-center group/day aspect-square select-none",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "size-full p-0 font-normal aria-selected:opacity-100"
        ),
        ...classNames,
      }}
      modifiersClassNames={{
        today: "bg-accent text-accent-foreground rounded-md",
        outside: "text-muted-foreground opacity-50",
        disabled: "text-muted-foreground opacity-50",
        hidden: "invisible",
        range_start: "rounded-l-md bg-accent",
        range_middle: "rounded-none bg-accent",
        range_end: "rounded-r-md bg-accent",
      }}
      components={{
        IconLeft: ({ className, ...props }) => (
          <ChevronLeftIcon className={cn("size-4", className)} {...props} />
        ),
        IconRight: ({ className, ...props }) => (
          <ChevronRightIcon className={cn("size-4", className)} {...props} />
        ),
        IconDropdown: ({ className, ...props }) => (
          <ChevronDownIcon className={cn("size-4", className)} {...props} />
        ),
      }}
      {...props}
    />
  );
}

export { Calendar };
