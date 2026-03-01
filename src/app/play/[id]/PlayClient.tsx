'use client';

import { DrawScreen } from '@/components/domain/DrawScreen';
import type { LuckyDraw } from '@/types';

interface PlayClientProps {
  drawData: {
    id: string;
    name: string;
    drawButtonLabel: string;
  };
}

export default function PlayClient({ drawData }: PlayClientProps) {
  // 최소 정보만으로 LuckyDraw 구성 — items, userId 등 민감 정보 없음
  const minimalDraw: LuckyDraw = {
    id: drawData.id,
    userId: '',  // 클라이언트에 노출하지 않음
    name: drawData.name,
    drawButtonLabel: drawData.drawButtonLabel,
    probabilityMode: 'equal', // play 모드에서 사용하지 않음
    isActive: true,
    createdAt: '',
    updatedAt: '',
    // items 없음 — 서버 API에서 추첨
  };

  return <DrawScreen draw={minimalDraw} mode="play" />;
}
