import Foundation
import Vision
import AppKit
// usage: ocr <image>...  → prints "== file" then recognized lines top-to-bottom
for path in CommandLine.arguments.dropFirst() {
  guard let img = NSImage(contentsOfFile: path), let cg = img.cgImage(forProposedRect: nil, context: nil, hints: nil) else { continue }
  let req = VNRecognizeTextRequest()
  req.recognitionLevel = .accurate
  req.recognitionLanguages = ["zh-Hant", "en-US"]
  req.usesLanguageCorrection = true
  try? VNImageRequestHandler(cgImage: cg).perform([req])
  print("== \(path)")
  let obs = (req.results ?? []).sorted { $0.boundingBox.minY > $1.boundingBox.minY }
  for o in obs { if let t = o.topCandidates(1).first { print(String(format: "%.3f %.3f %.3f %.3f\t", o.boundingBox.minX, o.boundingBox.minY, o.boundingBox.width, o.boundingBox.height) + t.string) } }
}
