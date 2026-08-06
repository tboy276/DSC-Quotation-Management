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
    <div className="bg-white p-5 rounded-[4px] border border-[#EAEAEA] shadow-[0_2px_8px_rgba(0,0,0,0.03)] space-y-5 animate-fade-in-up">
      {/* HEADER PHẦN */}
      <div className="flex items-center space-x-2 border-b border-[#EAEAEA] pb-3">
        {icon && <div className="text-[#111111]">{icon}</div>}
        <div>
          <h4 className="text-[15px] font-bold text-[#111111] uppercase tracking-wider">
            {title}
          </h4>
          {subtitle && (
            <p className="text-[12px] text-[#787774] mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* TOP INPUTS */}
      {topInputs && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {topInputs}
        </div>
      )}

      {/* MAIN BLOCK */}
      {(mainBlockTitle || mainLeftContent || mainRightContent || breakdownItems || infoBoxes) && (
        <div className="p-5 bg-[#F9F9F9] border border-[#EAEAEA] rounded-[4px] space-y-5">
          {/* Main Block Header */}
          {(mainBlockTitle || mainBlockHeaderRight) && (
            <div className="flex items-center justify-between border-b border-[#EAEAEA] pb-3">
              {mainBlockTitle && (
                <h5 className="text-[12px] font-bold text-[#111111] uppercase tracking-wider">
                  {mainBlockTitle}
                </h5>
              )}
              {mainBlockHeaderRight && (
                <div>{mainBlockHeaderRight}</div>
              )}
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            {/* Cột trái (hẹp hơn) - khoảng 5 cột */}
            {mainLeftContent && (
              <div className="md:col-span-5 space-y-5">
                {mainLeftContent}
              </div>
            )}

            {/* Cột phải (rộng hơn) - khoảng 7 cột */}
            <div className={mainLeftContent ? "md:col-span-7 space-y-4" : "col-span-1 md:col-span-12 space-y-4"}>
              
              {mainRightContent}

              {/* Breakdown items */}
              {breakdownItems && breakdownItems.length > 0 && (
                <div className="space-y-2.5 text-[13px] font-mono">
                  {breakdownItems.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center pb-1 border-b border-dashed border-[#EAEAEA]">
                      <span className="text-[#787774] font-sans">{item.label}</span>
                      <span className={`font-bold ${item.valueClassName || 'text-[#111111]'}`}>
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Breakdown Total */}
              {breakdownTotal && (
                <div className="border-t-2 border-[#111111] pt-3 flex flex-wrap gap-2 justify-between items-center font-mono">
                  <span className="text-[13px] font-bold text-[#111111] uppercase font-sans">
                    {breakdownTotal.label}
                  </span>
                  <span className="font-extrabold text-[#38517A] text-[15px]">
                    {breakdownTotal.value}
                  </span>
                </div>
              )}

              {/* Info Boxes */}
              {infoBoxes && infoBoxes.length > 0 && (
                <div className="flex gap-4 pt-3">
                  {infoBoxes.map((box, idx) => (
                    <div key={idx} className="bg-[#F0F0EE] p-3.5 rounded-[4px] flex-1 text-center border-l-4 border-slate-300">
                      <p className="text-[10px] font-bold text-[#787774] uppercase tracking-wider mb-1.5">{box.label}</p>
                      <p className={`font-mono font-extrabold text-[#38517A] leading-none ${isFinalTotal ? 'text-[28px]' : 'text-[22px]'}`}>
                        {box.value} {box.unit && <span className="text-[11px] font-bold text-[#111111] tracking-normal">{box.unit}</span>}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Bottom Note */}
          {bottomNote && (
            <div className="text-[11px] text-[#787774] italic mt-5 pt-3 border-t border-[#EAEAEA]">
              {bottomNote}
            </div>
          )}
        </div>
      )}

      {/* FOOTER TOTAL */}
      {(footerTitle || footerTotal) && (
        <div className={`p-4 mt-6 border rounded-[6px] flex flex-col md:flex-row items-center justify-between ${isFinalTotal ? 'bg-[#111111] border-[#111111] shadow-xl' : 'bg-[#F8F9FA] border-slate-200/60'}`}>
          <div>
            {footerTitle && (
              <h5 className={`font-extrabold uppercase ${isFinalTotal ? 'text-[20px] text-white' : 'text-[14px] text-slate-900'}`}>
                {footerTitle}
              </h5>
            )}
            {footerSubtitle && (
              <p className={`text-[11px] mt-1 font-mono ${isFinalTotal ? 'text-slate-400' : 'text-slate-400'}`}>
                {footerSubtitle}
              </p>
            )}
          </div>
          <div className="text-right mt-4 md:mt-0">
            {footerTotal && (
              <span className={`font-bold font-sans leading-none ${isFinalTotal ? 'text-[42px] text-emerald-400' : 'text-[24px] text-slate-900'}`}>
                {footerTotal} {footerTotalUnit && <span className={`font-bold font-sans uppercase ml-1.5 ${isFinalTotal ? 'text-[18px] text-white' : 'text-[13px] text-slate-900'}`}>{footerTotalUnit}</span>}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
