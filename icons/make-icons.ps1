# Draws app icons. Run: powershell -ExecutionPolicy Bypass -File icons\make-icons.ps1
Add-Type -AssemblyName System.Drawing

$here = $PSScriptRoot
$top = [System.Drawing.Color]::FromArgb(255, 110, 231, 183)
$bottom = [System.Drawing.Color]::FromArgb(255, 16, 185, 129)

function New-RoundedPath([double]$x, [double]$y, [double]$w, [double]$h, [double]$r) {
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $d = $r * 2
  $path.AddArc([float]$x, [float]$y, [float]$d, [float]$d, 180, 90)
  $path.AddArc([float]($x + $w - $d), [float]$y, [float]$d, [float]$d, 270, 90)
  $path.AddArc([float]($x + $w - $d), [float]($y + $h - $d), [float]$d, [float]$d, 0, 90)
  $path.AddArc([float]$x, [float]($y + $h - $d), [float]$d, [float]$d, 90, 90)
  $path.CloseFigure()
  return $path
}

function New-Base([bool]$bleed, [double]$content) {
  $bmp = New-Object System.Drawing.Bitmap 1024, 1024
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.Clear([System.Drawing.Color]::Transparent)

  $full = New-Object System.Drawing.RectangleF 0, 0, 1024, 1024
  $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush $full, $top, $bottom, 45.0

  if ($bleed) {
    $g.FillRectangle($brush, $full)
  } else {
    $path = New-RoundedPath 0 0 1024 1024 232
    $g.FillPath($brush, $path)
  }

  $g.TranslateTransform(512, 512)
  $g.ScaleTransform([float]$content, [float]$content)
  $g.TranslateTransform(-512, -512)

  $white = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)
  $cap = New-RoundedPath 412 214 200 380 100
  $g.FillPath($white, $cap)

  $pen = New-Object System.Drawing.Pen ([System.Drawing.Color]::White), 58
  $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $g.DrawArc($pen, 352, 336, 320, 320, 0, 180)
  $g.DrawLine($pen, 512, 656, 512, 752)
  $g.DrawLine($pen, 428, 752, 596, 752)

  $g.Dispose()
  return $bmp
}

function Save-Resized($source, [int]$size, [string]$file) {
  $bmp = New-Object System.Drawing.Bitmap $size, $size
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.DrawImage($source, 0, 0, $size, $size)
  $bmp.Save((Join-Path $here $file), [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose()
  $bmp.Dispose()
  Write-Output "  $file ($size x $size)"
}

$rounded = New-Base $false 1.16
$bleed = New-Base $true 1.0

Write-Output 'Icons:'
$rounded.Save((Join-Path $here 'icon-1024.png'), [System.Drawing.Imaging.ImageFormat]::Png)
Write-Output '  icon-1024.png (1024 x 1024)'
Save-Resized $rounded 512 'icon-512.png'
Save-Resized $rounded 192 'icon-192.png'
Save-Resized $rounded 32 'favicon-32.png'
Save-Resized $bleed 512 'icon-maskable-512.png'
Save-Resized $bleed 180 'apple-touch-icon.png'

$rounded.Dispose()
$bleed.Dispose()
Write-Output 'Done.'
