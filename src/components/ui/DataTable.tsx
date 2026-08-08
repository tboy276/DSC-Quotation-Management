import React, { useState, useMemo, useEffect } from 'react';
import { ArrowUp, ArrowDown, ArrowUpDown, Settings, Columns } from 'lucide-react';
import { ActionButton } from './ActionButton';

export interface DataTableColumn<T> {
  key: string;
  header: string;
  render: (row: T, index: number) => React.ReactNode;
  sortable?: boolean;
  sortValue?: (row: T) => string | number;
  className?: string;
  headerClassName?: string;
  defaultHidden?: boolean;
}

export interface DataTableAction<T> {
  key: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  tooltip?: string;
  onClick: (selectedRows: T[]) => void;
  enabled: (selectedCount: number, selectedRows: T[]) => boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
}

interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  keyExtractor: (row: T) => string;
  toolbarActions?: DataTableAction<T>[];
  onRowClick?: (row: T) => void;
  loading?: boolean;
  emptyMessage?: string;
  selectedIds?: string[];
  onSelectionChange?: (selectedIds: string[], selectedRows: T[]) => void;
  tableName?: string; // Key for localStorage column visibility persistence
}

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  toolbarActions = [],
  onRowClick,
  loading = false,
  emptyMessage = 'Không có dữ liệu hiển thị.',
  selectedIds: externalSelectedIds,
  onSelectionChange,
  tableName = 'default_table',
}: DataTableProps<T>) {
  // Internal selection state if not controlled externally
  const [internalSelectedIds, setInternalSelectedIds] = useState<string[]>([]);
  const selectedIds = externalSelectedIds !== undefined ? externalSelectedIds : internalSelectedIds;

  // Sorting state
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Column Visibility state & localStorage persistence
  const [hiddenColumnKeys, setHiddenColumnKeys] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`dt_cols_hidden_${tableName}`);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      // Ignore fallback
    }
    return columns.filter((c) => c.defaultHidden).map((c) => c.key);
  });

  const [showColSettings, setShowColSettings] = useState<boolean>(false);

  useEffect(() => {
    try {
      localStorage.setItem(`dt_cols_hidden_${tableName}`, JSON.stringify(hiddenColumnKeys));
    } catch (e) {
      // Ignore
    }
  }, [hiddenColumnKeys, tableName]);

  const toggleColumnVisibility = (colKey: string) => {
    setHiddenColumnKeys((prev) =>
      prev.includes(colKey) ? prev.filter((k) => k !== colKey) : [...prev, colKey]
    );
  };

  const visibleColumns = useMemo(() => {
    return columns.filter((c) => !hiddenColumnKeys.includes(c.key));
  }, [columns, hiddenColumnKeys]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    let nextIds: string[] = [];
    if (e.target.checked) {
      nextIds = data.map(keyExtractor);
    }
    if (externalSelectedIds === undefined) {
      setInternalSelectedIds(nextIds);
    }
    const nextRows = data.filter((row) => nextIds.includes(keyExtractor(row)));
    onSelectionChange?.(nextIds, nextRows);
  };

  const toggleRowSelection = (rowKey: string) => {
    let nextIds: string[];
    if (selectedIds.includes(rowKey)) {
      nextIds = selectedIds.filter((id) => id !== rowKey);
    } else {
      nextIds = [...selectedIds, rowKey];
    }
    if (externalSelectedIds === undefined) {
      setInternalSelectedIds(nextIds);
    }
    const nextRows = data.filter((r) => nextIds.includes(keyExtractor(r)));
    onSelectionChange?.(nextIds, nextRows);
  };

  const handleCheckboxCellClick = (rowKey: string, e: React.MouseEvent) => {
    e.stopPropagation();
    toggleRowSelection(rowKey);
  };

  const handleSort = (col: DataTableColumn<T>) => {
    if (!col.sortable) return;
    if (sortKey === col.key) {
      if (sortOrder === 'asc') {
        setSortOrder('desc');
      } else {
        setSortKey(null);
        setSortOrder('asc');
      }
    } else {
      setSortKey(col.key);
      setSortOrder('asc');
    }
  };

  // Sorted Data
  const sortedData = useMemo(() => {
    if (!sortKey) return data;
    const col = columns.find((c) => c.key === sortKey);
    if (!col) return data;

    const getValue = col.sortValue || ((row: any) => row[sortKey]);
    return [...data].sort((a, b) => {
      const valA = getValue(a);
      const valB = getValue(b);
      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      }
      return sortOrder === 'asc'
        ? String(valA).localeCompare(String(valB), 'vi')
        : String(valB).localeCompare(String(valA), 'vi');
    });
  }, [data, columns, sortKey, sortOrder]);

  const selectedRows = useMemo(() => {
    return data.filter((r) => selectedIds.includes(keyExtractor(r)));
  }, [data, selectedIds, keyExtractor]);

  const selectedCount = selectedIds.length;
  const isAllSelected = data.length > 0 && selectedCount === data.length;

  return (
    <div className="space-y-3">
      {/* Top Fixed Toolbar */}
      <div className="bg-white p-3 rounded-[10px] border border-[#EAEAEA] shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex flex-wrap items-center justify-between gap-3">
        {/* Selection Count Indicator */}
        <div className="flex items-center space-x-2 text-xs font-semibold text-[#111111]">
          <span className="px-2.5 py-1 bg-[#F0F0EE] border border-[#EAEAEA] rounded-[5px] font-mono text-[11px]">
            Đã chọn: <strong className="text-[#111111]">{selectedCount}</strong> / {data.length} dòng
          </span>
        </div>

        {/* Toolbar Dynamic Action Buttons + Column Visibility Toggle */}
        <div className="flex items-center space-x-2">
          {toolbarActions.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              {toolbarActions.map((action) => {
                const isEnabled = action.enabled(selectedCount, selectedRows);

                let variant: 'primary' | 'neutral' | 'danger' | 'positive' = 'primary';
                if (action.variant === 'secondary') variant = 'neutral';
                if (action.variant === 'danger') variant = 'danger';
                if (action.variant === 'success') variant = 'positive';

                return (
                  <ActionButton
                    key={action.key}
                    variant={variant}
                    disabled={!isEnabled}
                    onClick={() => action.onClick(selectedRows)}
                    title={action.tooltip}
                    icon={action.icon}
                    label={typeof action.label === 'string' ? action.label : undefined}
                  />
                );
              })}
            </div>
          )}

          {/* Section A: Column Visibility Settings Toggle Menu */}
          <div className="relative">
            <ActionButton
              variant="neutral"
              icon={Columns}
              onClick={() => setShowColSettings(!showColSettings)}
              title="Cấu hình ẩn/hiện cột bảng (Excel Column Visibility)"
            />

            {showColSettings && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-[10px] border border-[#EAEAEA] shadow-xl p-3 z-50 text-xs text-[#111111] space-y-2 animate-fade-in-up">
                <div className="flex items-center justify-between border-b border-[#EAEAEA] pb-2 font-bold">
                  <span>Ẩn / Hiện Cột Bảng</span>
                  <Settings className="w-3.5 h-3.5 text-[#787774]" />
                </div>

                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {columns.map((col) => {
                    const isVisible = !hiddenColumnKeys.includes(col.key);
                    return (
                      <label
                        key={col.key}
                        className="flex items-center space-x-2 p-1.5 rounded hover:bg-[#FBFBFA] cursor-pointer select-none"
                      >
                        <input
                          type="checkbox"
                          checked={isVisible}
                          onChange={() => toggleColumnVisibility(col.key)}
                          className="rounded accent-[#111111] cursor-pointer"
                        />
                        <span className="font-semibold text-xs text-[#111111]">
                          {col.header}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Table Container with Sticky Header */}
      <div className="bg-white border border-[#EAEAEA] rounded-[10px] overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
        <div className="max-h-[650vh] overflow-auto">
          <table className="w-full text-left border-collapse">
            {/* Sticky Header Row (position: sticky; top: 0; z-index: 10) */}
            <thead className="sticky top-0 z-10 bg-[#FBFBFA] border-b border-[#EAEAEA] text-[11px] font-bold uppercase text-[#787774] tracking-wider shadow-xs">
              <tr>
                {/* Column 1: Checkbox Header */}
                <th className="py-3 px-3.5 w-10 text-center border-b border-[#EAEAEA]">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                    className="rounded accent-[#111111] cursor-pointer"
                  />
                </th>

                {/* Custom Data Columns */}
                {visibleColumns.map((col) => {
                  const isSorted = sortKey === col.key;
                  return (
                    <th
                      key={col.key}
                      onClick={() => handleSort(col)}
                      className={`py-3 px-4 border-b border-[#EAEAEA] select-none ${
                        col.sortable ? 'cursor-pointer hover:bg-[#F0F0EE] transition-colors' : ''
                      } ${col.headerClassName || ''}`}
                    >
                      <div className="flex items-center space-x-1.5">
                        <span>{col.header}</span>
                        {col.sortable && (
                          <span className="text-[#787774]">
                            {isSorted ? (
                              sortOrder === 'asc' ? (
                                <ArrowUp className="w-3.5 h-3.5 text-[#111111] stroke-[2.5]" />
                              ) : (
                                <ArrowDown className="w-3.5 h-3.5 text-[#111111] stroke-[2.5]" />
                              )
                            ) : (
                              <ArrowUpDown className="w-3 h-3 text-[#787774]/50" />
                            )}
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody className="divide-y divide-[#EAEAEA] text-xs text-[#111111]">
              {loading ? (
                <tr>
                  <td
                    colSpan={visibleColumns.length + 1}
                    className="py-12 text-center text-[#787774] italic"
                  >
                    Đang tải dữ liệu bảng...
                  </td>
                </tr>
              ) : sortedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={visibleColumns.length + 1}
                    className="py-12 text-center text-[#787774] italic"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                sortedData.map((row, index) => {
                  const rKey = keyExtractor(row);
                  const isChecked = selectedIds.includes(rKey);

                  return (
                    <tr
                      key={rKey}
                      onClick={(e) => {
                        if (window.getSelection()?.toString().length) {
                          return;
                        }
                        const target = e.target as HTMLElement;
                        const isInteractive = target.closest('button, a, input, select, textarea, [role="button"]');
                        if (isInteractive) {
                          return;
                        }
                        toggleRowSelection(rKey);
                        onRowClick?.(row);
                      }}
                      className={`hover:bg-[#F0F0EE] transition-colors cursor-pointer ${isChecked ? 'bg-[#F0F0EE]/60' : ''}`}
                    >
                      {/* Column 1: Row Checkbox */}
                      <td
                        className="py-3 px-3.5 text-center"
                        onClick={(e) => handleCheckboxCellClick(rKey, e)}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // Handled by onClick of cell
                          className="rounded accent-[#111111] cursor-pointer"
                        />
                      </td>

                      {/* Row Data Cells */}
                      {visibleColumns.map((col) => (
                        <td
                          key={col.key}
                          className={`py-3 px-4 ${col.className || ''}`}
                        >
                          {col.render(row, index)}
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
