const fs = require('fs');

const file = 'src/components/ui/DataTable.tsx';
let content = fs.readFileSync(file, 'utf8');

// Header
content = content.replace(/                \}\)\}\s*<\/tr>\s*<\/thead>/g, 
`                })}
                {rowActions.length > 0 && <th className="py-3 px-4 w-1 border-b border-[#EAEAEA]"></th>}
              </tr>
            </thead>`);

// Colspan adjustments
content = content.replace(/colSpan=\{visibleColumns.length \+ 1\}/g, 'colSpan={visibleColumns.length + (rowActions.length > 0 ? 2 : 1)}');

// Row
content = content.replace(/<tr\s*key=\{rKey\}/g, '<tr\n                      key={rKey}\n                      className={`group ${onRowClick ? \'cursor-pointer\' : \'\'} hover:bg-[#FBFBFA] transition-colors ${isChecked ? \'bg-slate-50 font-medium\' : \'\'}`}\n                      onClick={() => onRowClick && onRowClick(row)}');

content = content.replace(/<td\s*key=\{col\.key\}\s*className={`py-3 px-4 \$\{col\.className \|\| ''\}`}/g, '<td key={col.key} className={`py-3 px-4 ${col.className || \'\'}`}');

content = content.replace(/                          \)\;\s*\}\)\}\s*<\/tr>\s*\)\;\s*\}\)\s*\)\}/g,
`                          );
                        })}
                        {rowActions.length > 0 && (
                          <td className="py-3 px-4 text-right align-middle opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                              {rowActions.map(action => {
                                const isEnabled = action.enabled(1, [row]);
                                const variant = action.variant || 'neutral';
                                return (
                                  <ActionButton
                                    key={action.key}
                                    variant={variant}
                                    icon={action.icon}
                                    tooltip={action.tooltip}
                                    disabled={!isEnabled}
                                    onClick={() => action.onClick([row])}
                                  />
                                );
                              })}
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}`);

fs.writeFileSync(file, content);
console.log('Fixed DataTable rowActions');
