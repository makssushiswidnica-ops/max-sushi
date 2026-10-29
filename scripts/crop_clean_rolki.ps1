Add-Type -AssemblyName System.Drawing

$fileP1 = 'C:\Users\Admin\.gemini\antigravity-ide\brain\82f2576b-9d22-45f8-ad0c-e11cc94dae05\.user_uploaded\media_1792935611471.jpg'
$fileP2 = 'C:\Users\Admin\.gemini\antigravity-ide\brain\82f2576b-9d22-45f8-ad0c-e11cc94dae05\.user_uploaded\media_1792935611549.jpg'

$outDir = 'c:\llixtar\WORK\max-sushi\public\images\rolki'
if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir -Force }

$targetSize = 200
$centerT = $targetSize / 2

$rollsP1 = @(
    @{ Name = "bonito";                     CX = 212; CY = 182; RX = 58; RY = 58 },
    @{ Name = "laguna-red";                 CX = 472; CY = 180; RX = 58; RY = 56 },
    @{ Name = "rock-n-roll";                CX = 210; CY = 370; RX = 58; RY = 60 },
    @{ Name = "sakura";                     CX = 478; CY = 372; RX = 60; RY = 60 },
    @{ Name = "lawa-tunczyk";               CX = 206; CY = 540; RX = 56; RY = 62 },
    @{ Name = "lawa-losos";                 CX = 472; CY = 540; RX = 56; RY = 62 },
    @{ Name = "kalifornia-losos-masago";    CX = 215; CY = 758; RX = 60; RY = 60 },
    @{ Name = "kalifornia-tunczyk-tempura"; CX = 475; CY = 756; RX = 60; RY = 60 },
    @{ Name = "kalifornia-krewetki";        CX = 210; CY = 922; RX = 58; RY = 62 },
    @{ Name = "czarna-kalifornia";          CX = 476; CY = 920; RX = 60; RY = 60 }
)

$rollsP2 = @(
    @{ Name = "hanami";                     CX = 208; CY = 185; RX = 56; RY = 60 },
    @{ Name = "sniezny-krab";               CX = 470; CY = 185; RX = 56; RY = 58 },
    @{ Name = "kalifornia-tunczyk-sezam";   CX = 209; CY = 368; RX = 58; RY = 60 },
    @{ Name = "kalifornia-tunczyk-masago";  CX = 472; CY = 370; RX = 58; RY = 60 },
    @{ Name = "kalifornia-light";           CX = 212; CY = 560; RX = 60; RY = 60 },
    @{ Name = "kalifornia-masago";          CX = 473; CY = 571; RX = 58; RY = 58 },
    @{ Name = "miyako";                     CX = 214; CY = 754; RX = 58; RY = 60 },
    @{ Name = "cheese-light";               CX = 474; CY = 755; RX = 58; RY = 60 },
    @{ Name = "cheese-ami";                 CX = 212; CY = 920; RX = 60; RY = 60 },
    @{ Name = "miami";                      CX = 472; CY = 928; RX = 57; RY = 60 }
)

function Crop-Rolls($file, $list) {
    $src = New-Object System.Drawing.Bitmap($file)
    foreach ($r in $list) {
        $dest = New-Object System.Drawing.Bitmap($targetSize, $targetSize)
        $g = [System.Drawing.Graphics]::FromImage($dest)
        $g.Clear([System.Drawing.Color]::Black)
        $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality

        $cx = $r.CX; $cy = $r.CY; $rx = $r.RX; $ry = $r.RY

        $srcRect = New-Object System.Drawing.Rectangle(($cx - $rx), ($cy - $ry), ($rx * 2), ($ry * 2))
        $destRect = New-Object System.Drawing.Rectangle(($centerT - $rx), ($centerT - $ry), ($rx * 2), ($ry * 2))

        $path = New-Object System.Drawing.Drawing2D.GraphicsPath
        $path.AddEllipse(($centerT - $rx), ($centerT - $ry), ($rx * 2), ($ry * 2))
        $g.SetClip($path)
        $g.DrawImage($src, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
        $g.ResetClip()
        $path.Dispose()
        $g.Dispose()

        # Очищення червоного кружечка NEW якщо випадково потрапив
        for ($y = 0; $y -lt 90; $y++) {
            for ($x = 0; $x -lt $targetSize; $x++) {
                $c = $dest.GetPixel($x, $y)
                if ($c.R -gt 135 -and $c.G -lt 65 -and $c.B -lt 65) {
                    $dest.SetPixel($x, $y, [System.Drawing.Color]::Black)
                }
            }
        }

        $savePath = Join-Path $outDir "$($r.Name).jpg"
        $dest.Save($savePath, [System.Drawing.Imaging.ImageFormat]::Jpeg)
        $dest.Dispose()
        Write-Host "Saved: $savePath"
    }
    $src.Dispose()
}

Crop-Rolls $fileP1 $rollsP1
Crop-Rolls $fileP2 $rollsP2
