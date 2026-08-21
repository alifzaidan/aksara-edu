import { Column } from '@tanstack/react-table';
import { Check, PlusCircle } from 'lucide-react';
import * as React from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface DataTableFacetedFilterProps<TData, TValue> {
    column?: Column<TData, TValue>;
    title?: string;
    options: {
        label: string;
        value: string;
        icon?: React.ComponentType<{ className?: string }>;
    }[];
    selectedValues?: string[];
    onFilterChange?: (values: string[]) => void;
}

export function DataTableFacetedFilter<TData, TValue>({
    column,
    title,
    options,
    selectedValues: propSelectedValues,
    onFilterChange,
}: DataTableFacetedFilterProps<TData, TValue>) {
    const facets = column?.getFacetedUniqueValues();
    const columnFilterValue = column?.getFilterValue();
    const currentValues = propSelectedValues !== undefined
        ? propSelectedValues
        : (Array.isArray(columnFilterValue) ? columnFilterValue : columnFilterValue ? [columnFilterValue as string] : []);

    const selectedValues = new Set(currentValues);

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 w-full border-dashed">
                    <PlusCircle />
                    {title}
                    {selectedValues?.size > 0 && (
                        <>
                            <Separator orientation="vertical" className="mx-2 h-4" />
                            <Badge variant="secondary" className="rounded-sm px-1 font-normal lg:hidden">
                                {selectedValues.size}
                            </Badge>
                            <div className="hidden space-x-1 lg:flex">
                                {selectedValues.size > 2 ? (
                                    <Badge variant="secondary" className="rounded-sm px-1 font-normal">
                                        {selectedValues.size} selected
                                    </Badge>
                                ) : (
                                    options
                                        .filter((option) => selectedValues.has(option.value))
                                        .map((option) => (
                                            <Badge variant="secondary" key={option.value} className="rounded-sm px-1 font-normal">
                                                {option.label}
                                            </Badge>
                                        ))
                                )}
                            </div>
                        </>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0" align="start">
                <Command>
                    <CommandInput placeholder={title} />
                    <CommandList>
                        <CommandEmpty>No results found.</CommandEmpty>
                        <CommandGroup>
                            {options.map((option) => {
                                const isSelected = selectedValues.has(option.value);
                                return (
                                    <CommandItem
                                        key={option.value}
                                        onSelect={() => {
                                            const next = new Set(selectedValues);
                                            if (isSelected) {
                                                next.delete(option.value);
                                            } else {
                                                next.add(option.value);
                                            }
                                            const nextArr = Array.from(next);
                                            if (onFilterChange) {
                                                onFilterChange(nextArr);
                                            } else if (column) {
                                                column.setFilterValue(nextArr.length ? nextArr : undefined);
                                            }
                                        }}
                                    >
                                        <div
                                            className={cn(
                                                'border-primary mr-2 flex h-4 w-4 items-center justify-center rounded-sm border',
                                                isSelected ? 'bg-primary text-primary-foreground' : 'opacity-50 [&_svg]:invisible',
                                            )}
                                        >
                                            <Check />
                                        </div>
                                        {option.icon && <option.icon className="text-muted-foreground mr-2 h-4 w-4" />}
                                        <span>{option.label}</span>
                                        {facets?.get(option.value) && (
                                            <span className="ml-auto flex h-4 w-4 items-center justify-center font-mono text-xs">
                                                {facets.get(option.value)}
                                            </span>
                                        )}
                                    </CommandItem>
                                );
                            })}
                        </CommandGroup>
                        {selectedValues.size > 0 && (
                            <>
                                <CommandSeparator />
                                <CommandGroup>
                                    <CommandItem
                                        onSelect={() => {
                                            if (onFilterChange) {
                                                onFilterChange([]);
                                            } else if (column) {
                                                column.setFilterValue(undefined);
                                            }
                                        }}
                                        className="justify-center text-center"
                                    >
                                        Hapus filter
                                    </CommandItem>
                                </CommandGroup>
                            </>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
