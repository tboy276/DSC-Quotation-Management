const fs = require('fs');
let dtContent = fs.readFileSync('src/components/ui/DataTable.tsx', 'utf8');

dtContent = dtContent.replace(/\{\s*col\.render\(row,\s*index\)\s*\}\r?\n\s*<\/td>\r?\n\s*\)\)\}\r?\n\s*<\/tr>/,
`{col.render(row, index)}
                        </td>
                      ))}
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
                                  title={action.tooltip}
                                  disabled={!isEnabled}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    action.onClick([row]);
                                  }}
                                />
                              );
                            })}
                          </div>
                        </td>
                      )}
                    </tr>`);

fs.writeFileSync('src/components/ui/DataTable.tsx', dtContent);
