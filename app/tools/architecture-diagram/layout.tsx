/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Architecture Diagram',
  description: 'Visual architecture modeling tool for designing enterprise systems.',
};

export default function ArchitectureDiagramLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
