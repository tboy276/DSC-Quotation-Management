import React from 'react';

export interface CostBreakdownItem {
  label: React.ReactNode;
  value: React.ReactNode;
  valueClassName?: string;
}

export interface CostInfoBox {
  label: React.ReactNode;
  value: React.ReactNode;
  unit?: string;
}

export interface CostSectionCardProps {
  // 1. Header
  icon?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  
  // 2. Top Inputs
  topInputs?: React.ReactNode;
  
  // 3. Main Block
  mainBlockTitle?: React.ReactNode;
  mainBlockHeaderRight?: React.ReactNode;
  mainLeftContent?: React.ReactNode;
  
  // Right column inside main block
  mainRightContent?: React.ReactNode;
  breakdownItems?: CostBreakdownItem[];
  breakdownTotal?: {
    label: React.ReactNode;
    value: React.ReactNode;
  };
  
  infoBoxes?: CostInfoBox[];
  bottomNote?: React.ReactNode;

  // 4. Footer (Total Section)
  footerTitle?: React.ReactNode;
  footerSubtitle?: React.ReactNode;
  footerTotal?: React.ReactNode;
  footerTotalUnit?: React.ReactNode;
  isFinalTotal?: boolean;
}

export const CostSectionCard: React.FC<CostSectionCardProps> = ({
  icon,
  title,
  subtitle,
  topInputs,
  mainBlockTitle,
  mainBlockHeaderRight,
  mainLeftContent,
  mainRightContent,
  breakdownItems,
  breakdownTotal,
  infoBoxes,
  bottomNote,
  footerTitle,
  footerSubtitle,
  footerTotal,
  footerTotalUnit,
  isFinalTotal = false,
}) => {
  return (
    <div className="bg-white p-4 rounded-[8px] border border-[#EAEAEA] shadow-[0_2px_6px_rgba(0,0,0,0.02)] space-y-4 animate-fade-in-up">
      {/* HEADER PHẦN */}
      <div className="flex items-center space-x-2 border-b border-[#EAEAEA] pb-2.5">
        {icon && <div className="text-[#111111]">{icon}</div>}
        <div>
          <h4 className="text-xs font-bold text-[#111111] uppercase tracking-wider">
            {title}
          </h4>
          {subtitle && (
            <p className="text-[11px] text-[#787774] mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* TOP INPUTS */}
      {topInputs && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {topInputs}
        </div>
      )}

      {/* MAIN BLOCK */}
      {(mainBlockTitle || mainLeftContent || mainRightContent || breakdownItems || infoBoxes) && (
        <div className="p-3.5 bg-[#FBFBFA] border border-[#EAEAEA] rounded-[6px] space-y-3.5">
          {/* Main Block Header */}
          {(mainBlockTitle || mainBlockHeaderRight) && (
            <div className="flex items-center justify-between border-b border-[#EAEAEA] pb-2">
              {mainBlockTitle && (
                <h5 className="text-[11px] font-bold text-[#111111] uppercase tracking-wider">
                  {mainBlockTitle}
                </h5>
              )}
              {mainBlockHeaderRight && (
                <div>{mainBlockHeaderRight}</div>
              )}
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* Cột trái (hẹp hơn) - khoảng 5 cột */}
            {mainLeftContent && (
              <div className="md:col-span-5 space-y-3.5">
                {mainLeftContent}
              </div>
            )}

            {/* Cột phải (rộng hơn) - khoảng 7 cột */}
            <div className={mainLeftContent ? "md:col-span-7 space-y-3" : "col-span-1 md:col-span-12 space-y-3"}>
              
              {mainRightContent}

              {/* Breakdown items */}
              {breakdownItems && breakdownItems.length > 0 && (
                <div className="space-y-1.5 text-xs font-mono">
                  {breakdownItems.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center pb-1 border-b border-[#EAEAEA]">
                      <span className="text-[#787774] font-sans text-[11px]">{item.label}</span>
                      <span className={`font-bold ${item.valueClassName || 'text-[#111111]'}`}>
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Breakdown Total */}
              {breakdownTotal && (
                <div className="border-t border-[#111111] pt-2 flex flex-wrap gap-2 justify-between items-center font-mono">
                  <span className="text-xs font-bold text-[#111111] uppercase font-sans">
                    {breakdownTotal.label}
                  </span>
                  <span className="font-extrabold text-[#111111] text-sm">
                    {breakdownTotal.value}
                  </span>
                </div>
              )}

              {/* Info Boxes */}
              {infoBoxes && infoBoxes.length > 0 && (
                <div className="flex gap-3 pt-2">
                  {infoBoxes.map((box, idx) => (
                    <div key={idx} className="bg-white p-2.5 rounded-[6px] flex-1 text-center border border-[#EAEAEA] shadow-xs">
                      <p className="text-[10px] font-bold text-[#787774] uppercase tracking-wider mb-1">{box.label}</p>
                      <p className={`font-mono font-extrabold text-[#111111] leading-none ${isFinalTotal ? 'text-2xl' : 'text-lg'}`}>
                        {box.value} {box.unit && <span className="text-[11px] font-bold text-[#787774] tracking-normal">{box.unit}</span>}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Bottom Note */}
          {bottomNote && (
            <div className="text-[11px] text-[#787774] italic mt-3 pt-2 border-t border-[#EAEAEA]">
              {bottomNote}
            </div>
          )}
        </div>
      )}

      {/* FOOTER TOTAL */}
      {(footerTitle || footerTotal) && (
        <div className={`p-3.5 border rounded-[6px] ${isFinalTotal ? 'bg-[#111111] border-[#111111] text-white shadow-xs flex flex-col items-end justify-center text-right' : 'bg-[#FBFBFA] border-[#EAEAEA] flex items-center justify-between'}`}>
          {isFinalTotal ? (
            <div>
              {footerTitle && (
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  {footerTitle}
                </p>
              )}
              <div className="flex items-baseline justify-end gap-2">
                {footerTotal && (
                  <span className="font-mono font-extrabold text-2xl text-emerald-400 leading-none">
                    {footerTotal}
                  </span>
                )}
                {footerTotalUnit && (
                  <span className="font-mono font-bold text-xs uppercase text-white">
                    {footerTotalUnit}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <>
              <div>
                {footerTitle && (
                  <p className="text-xs font-bold text-[#111111] uppercase tracking-wider mb-0.5">
                    {footerTitle}
                  </p>
                )}
                {footerSubtitle && (
                  <p className="text-[10px] mt-0.5 font-mono text-[#787774]">
                    {footerSubtitle}
                  </p>
                )}
              </div>
              <div className="text-right">
                {footerTotal && (
                  <span className="font-bold text-base font-mono text-[#111111] leading-none">
                    {footerTotal}
                  </span>
                )}
                {footerTotalUnit && (
                  <span className="font-mono font-bold text-xs uppercase text-[#787774] ml-1">
                    {footerTotalUnit}
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
