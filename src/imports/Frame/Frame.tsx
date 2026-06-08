function Group() {
  return (
    <div className="-translate-x-1/2 -translate-y-1/2 absolute contents left-[calc(50%-0.19px)] top-[calc(50%-16.17px)]">
      <div className="-translate-x-1/2 -translate-y-1/2 absolute bg-[#3e8e67] h-[95.659px] left-[calc(50%-52.78px)] rounded-[47.592px] top-[calc(50%-16.17px)] w-[139.444px]" />
      <div className="-translate-x-1/2 -translate-y-1/2 absolute bg-[#9d1c43] h-[95.659px] left-[calc(50%+52.4px)] rounded-[47.592px] top-[calc(50%-16.17px)] w-[139.444px]" />
    </div>
  );
}

function Group1() {
  return (
    <div className="absolute contents left-[65px] top-[342px]">
      <Group />
      <p className="absolute font-['Gluten:Regular',sans-serif] font-normal leading-[normal] left-[83.08px] not-italic text-[61.869px] text-white top-[366.75px] whitespace-nowrap">NDEKO</p>
    </div>
  );
}

function Group2() {
  return (
    <div className="-translate-x-1/2 -translate-y-1/2 absolute contents left-[calc(50%-0.19px)] top-[calc(50%+0.04px)]">
      <Group1 />
      <p className="absolute font-['Gluten:Regular',sans-serif] font-normal leading-[normal] left-[84.99px] not-italic text-[#060706] text-[23.796px] top-[449.08px] whitespace-nowrap">Smarter Is Better</p>
    </div>
  );
}

export default function Frame() {
  return (
    <div className="bg-[#fff9fa] relative size-full" data-name="Frame">
      <Group2 />
    </div>
  );
}