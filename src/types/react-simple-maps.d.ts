declare module 'react-simple-maps' {
  import * as React from 'react'

  interface ComposableMapProps {
    width?: number
    height?: number
    style?: React.CSSProperties
    projectionConfig?: {
      scale?: number
      center?: [number, number]
      rotate?: [number, number, number]
      parallels?: [number, number]
    }
    children?: React.ReactNode
  }

  interface GeographyFeature {
    rsmKey: string
    [key: string]: unknown
  }

  interface GeographiesRenderProps {
    geographies: GeographyFeature[]
  }

  interface GeographiesProps {
    geography: string | object
    children: (props: GeographiesRenderProps) => React.ReactNode
    parseGeographies?: (features: unknown[]) => unknown[]
  }

  interface GeographyStyleProp {
    default?: React.CSSProperties
    hover?: React.CSSProperties
    pressed?: React.CSSProperties
  }

  interface GeographyProps {
    geography: GeographyFeature
    fill?: string
    stroke?: string
    strokeWidth?: number
    style?: GeographyStyleProp
  }

  interface MarkerProps {
    coordinates: [number, number]
    children?: React.ReactNode
  }

  interface ZoomableGroupProps {
    center?: [number, number]
    zoom?: number
    children?: React.ReactNode
  }

  export const ComposableMap: React.FC<ComposableMapProps>
  export const Geographies: React.FC<GeographiesProps>
  export const Geography: React.FC<GeographyProps>
  export const Marker: React.FC<MarkerProps>
  export const ZoomableGroup: React.FC<ZoomableGroupProps>
}
