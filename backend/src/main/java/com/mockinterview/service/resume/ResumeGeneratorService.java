package com.mockinterview.service.resume;

import com.mockinterview.entity.ResumeAnalysis;
import com.mockinterview.entity.User;
import com.mockinterview.entity.UserProfile;
import com.mockinterview.exception.ResourceNotFoundException;
import com.mockinterview.repository.ResumeAnalysisRepository;
import com.mockinterview.repository.UserProfileRepository;
import com.mockinterview.repository.UserRepository;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.apache.poi.xwpf.usermodel.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Map;

@Service
public class ResumeGeneratorService {

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final ResumeAnalysisRepository resumeAnalysisRepository;

    public ResumeGeneratorService(UserRepository userRepository,
                                  UserProfileRepository userProfileRepository,
                                  ResumeAnalysisRepository resumeAnalysisRepository) {
        this.userRepository = userRepository;
        this.userProfileRepository = userProfileRepository;
        this.resumeAnalysisRepository = resumeAnalysisRepository;
    }

    @Transactional
    public Map<String, String> generateImprovedResume(String email, Map<String, String> corrections) throws IOException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
        UserProfile profile = userProfileRepository.findByUser(user)
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found: " + email));

        String url = profile.getResumeUrl();
        if (url == null || !url.contains(":uploads/resumes/")) {
            throw new ResourceNotFoundException("No active resume uploaded to build upon");
        }

        int colonIndex = url.indexOf(":uploads/resumes/");
        String originalName = url.substring(0, colonIndex);
        String filePathStr = url.substring(colonIndex + 1);
        Path originalPath = Paths.get(filePathStr);

        if (!Files.exists(originalPath)) {
            throw new FileNotFoundException("Original resume file not found on disk");
        }

        String baseNameWithoutExt = originalName.substring(0, originalName.lastIndexOf("."));
        String ext = originalName.substring(originalName.lastIndexOf(".")).toLowerCase();

        // 1. Get the latest analysis to load raw text as fallback
        ResumeAnalysis latestAnalysis = resumeAnalysisRepository.findFirstByUserEmailOrderByCreatedAtDesc(email)
                .orElseThrow(() -> new ResourceNotFoundException("No resume analysis found for this candidate"));
        
        String modifiedText = latestAnalysis.getRawText();
        for (Map.Entry<String, String> entry : corrections.entrySet()) {
            if (entry.getKey() != null && entry.getValue() != null && !entry.getKey().isBlank()) {
                modifiedText = modifiedText.replace(entry.getKey(), entry.getValue());
            }
        }

        Path uploadDir = Paths.get("uploads/resumes");
        if (!Files.exists(uploadDir)) {
            Files.createDirectories(uploadDir);
        }

        String finalPdfFilename = user.getId() + "_improved_" + System.currentTimeMillis() + ".pdf";
        String finalDocxFilename = user.getId() + "_improved_" + System.currentTimeMillis() + ".docx";
        
        Path finalPdfPath = uploadDir.resolve(finalPdfFilename);
        Path finalDocxPath = uploadDir.resolve(finalDocxFilename);

        // 2. Perform file-based structural generation
        if (ext.equals(".docx")) {
            // Modify original DOCX to preserve exact formatting
            try (InputStream is = Files.newInputStream(originalPath);
                 XWPFDocument doc = new XWPFDocument(is)) {
                
                // Replace text in paragraphs
                for (XWPFParagraph p : doc.getParagraphs()) {
                    replaceTextInParagraph(p, corrections);
                }
                
                // Replace text in tables
                for (XWPFTable tbl : doc.getTables()) {
                    for (XWPFTableRow row : tbl.getRows()) {
                        for (XWPFTableCell cell : row.getTableCells()) {
                            for (XWPFParagraph p : cell.getParagraphs()) {
                                replaceTextInParagraph(p, corrections);
                            }
                        }
                    }
                }

                try (OutputStream os = Files.newOutputStream(finalDocxPath)) {
                    doc.write(os);
                }
            }
            // Typeset raw text to PDF as the download fallback
            writeTextToPdf(modifiedText, finalPdfPath);
        } else {
            // Original is PDF: Typeset the modified text to both formats
            writeTextToPdf(modifiedText, finalPdfPath);
            writeTextToDocx(modifiedText, finalDocxPath);
        }

        // 3. Save the PDF as the active profile resumeUrl
        String newProfileResumeUrl = baseNameWithoutExt + "_improved.pdf:uploads/resumes/" + finalPdfFilename;
        profile.setResumeUrl(newProfileResumeUrl);
        userProfileRepository.save(profile);

        // Return the final filenames for download API endpoints
        return Map.of(
            "pdfFile", finalPdfFilename,
            "docxFile", finalDocxFilename
        );
    }

    private void replaceTextInParagraph(XWPFParagraph paragraph, Map<String, String> corrections) {
        String text = paragraph.getParagraphText();
        boolean modified = false;
        
        for (Map.Entry<String, String> entry : corrections.entrySet()) {
            String target = entry.getKey();
            String replacement = entry.getValue();
            if (target != null && !target.isBlank() && text.contains(target)) {
                text = text.replace(target, replacement);
                modified = true;
            }
        }
        
        if (modified) {
            List<XWPFRun> runs = paragraph.getRuns();
            if (!runs.isEmpty()) {
                for (int i = runs.size() - 1; i > 0; i--) {
                    paragraph.removeRun(i);
                }
                runs.get(0).setText(text, 0);
            }
        }
    }

    private void writeTextToPdf(String text, Path path) throws IOException {
        try (PDDocument doc = new PDDocument()) {
            String[] lines = text.split("\n");
            
            PDPage page = new PDPage();
            doc.addPage(page);
            
            PDType1Font font = new PDType1Font(Standard14Fonts.FontName.HELVETICA);
            PDPageContentStream contentStream = new PDPageContentStream(doc, page);
            contentStream.beginText();
            contentStream.setFont(font, 9);
            contentStream.setLeading(12.0f);
            contentStream.newLineAtOffset(50, 750);
            
            int y = 750;
            for (String line : lines) {
                String sanitized = line.replaceAll("[^\\x20-\\x7E]", "").trim();
                if (sanitized.isEmpty()) {
                    contentStream.newLine();
                    y -= 12;
                    continue;
                }
                
                if (y < 50) {
                    contentStream.endText();
                    contentStream.close();
                    
                    page = new PDPage();
                    doc.addPage(page);
                    contentStream = new PDPageContentStream(doc, page);
                    contentStream.beginText();
                    contentStream.setFont(font, 9);
                    contentStream.setLeading(12.0f);
                    contentStream.newLineAtOffset(50, 750);
                    y = 750;
                }
                
                contentStream.showText(sanitized);
                contentStream.newLine();
                y -= 12;
            }
            contentStream.endText();
            contentStream.close();
            doc.save(path.toFile());
        }
    }

    private void writeTextToDocx(String text, Path path) throws IOException {
        try (XWPFDocument doc = new XWPFDocument()) {
            String[] lines = text.split("\n");
            for (String line : lines) {
                XWPFParagraph p = doc.createParagraph();
                XWPFRun r = p.createRun();
                r.setText(line);
            }
            try (OutputStream os = Files.newOutputStream(path)) {
                doc.write(os);
            }
        }
    }
}
