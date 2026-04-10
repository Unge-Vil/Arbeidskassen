import * as React from "react"

export type WidgetSize = "1x1" | "2x2" | "2x4" | "4x4"
export type WidgetCategory = "overview" | "actions" | "apps" | "tools"

export interface WidgetConfig<Props extends object = Record<string, unknown>> {
  id: string
  name: string
  description: string
  defaultSize: WidgetSize
  component: React.ComponentType<Props>
  defaultProps?: Partial<Props>
  category?: WidgetCategory
}

export const widgetSizeToDimensions: Record<WidgetSize, { w: number; h: number }> = {
  "1x1": { w: 2, h: 2 },
  "2x2": { w: 3, h: 2 },
  "2x4": { w: 4, h: 4 },
  "4x4": { w: 4, h: 4 },
}

class Registry {
  private widgets: Map<string, WidgetConfig<object>> = new Map()

  register<Props extends object>(widget: WidgetConfig<Props>) {
    this.widgets.set(widget.id, widget as WidgetConfig<object>)
    return widget
  }

  get(id: string): WidgetConfig<object> | undefined {
    return this.widgets.get(id)
  }

  getAll(): WidgetConfig<object>[] {
    return Array.from(this.widgets.values())
  }
}

export const WidgetRegistry = new Registry()
