import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';
const meta = { title: 'Primitives/Button', component: Button } satisfies Meta<typeof Button>;
export default meta;
type S = StoryObj<typeof meta>;
export const Primary: S = { args: { children: 'Button' } };
