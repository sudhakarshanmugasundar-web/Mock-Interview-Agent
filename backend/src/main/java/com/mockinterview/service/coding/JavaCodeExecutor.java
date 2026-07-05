package com.mockinterview.service.coding;

import org.springframework.stereotype.Service;

import javax.tools.*;
import java.io.*;
import java.nio.file.*;
import java.util.List;
import java.util.concurrent.*;

/**
 * Compiles and executes arbitrary Java source code in an isolated temp directory.
 * Compile timeout: 15s, run timeout: 8s per test case.
 */
@Service
public class JavaCodeExecutor {

    private static final int COMPILE_TIMEOUT_SECONDS = 15;
    private static final int RUN_TIMEOUT_SECONDS = 8;

    public record ExecutionResult(
        String output,
        String error,
        boolean compilationError,
        long executionTimeMs
    ) {}

    /**
     * Compile and run a complete Java class named "Solution".
     * The code must declare {@code public class Solution}.
     */
    public ExecutionResult runSolution(String solutionCode) {
        return execute(List.of(new SourceFile("Solution.java", solutionCode)), "Solution");
    }

    /**
     * Compile Solution.java + TestHarness.java together, then run TestHarness.
     * Used for evaluated test case runs.
     */
    public ExecutionResult runWithHarness(String solutionCode, String harnessCode) {
        return execute(
            List.of(
                new SourceFile("Solution.java", solutionCode),
                new SourceFile("TestHarness.java", harnessCode)
            ),
            "TestHarness"
        );
    }

    private record SourceFile(String filename, String content) {}

    private ExecutionResult execute(List<SourceFile> sources, String mainClass) {
        Path tempDir = null;
        try {
            tempDir = Files.createTempDirectory("javaexec_");
            final Path dir = tempDir;

            // Write all source files
            for (SourceFile src : sources) {
                Files.writeString(dir.resolve(src.filename()), src.content());
            }

            // ── Compile ──────────────────────────────────────────────────────
            JavaCompiler compiler = ToolProvider.getSystemJavaCompiler();
            if (compiler == null) {
                return new ExecutionResult("", "Java compiler (javac) is not available on this JVM. Use a JDK, not a JRE.", true, 0);
            }

            StringWriter compileOut = new StringWriter();
            File[] sourceFiles = sources.stream()
                .map(s -> dir.resolve(s.filename()).toFile())
                .toArray(File[]::new);

            boolean compileSuccess;
            try (StandardJavaFileManager fm = compiler.getStandardFileManager(null, null, null)) {
                Iterable<? extends JavaFileObject> units = fm.getJavaFileObjects(sourceFiles);
                JavaCompiler.CompilationTask task = compiler.getTask(compileOut, fm, null, null, null, units);

                ExecutorService compileExec = Executors.newSingleThreadExecutor();
                Future<Boolean> compileFuture = compileExec.submit(task::call);
                try {
                    compileSuccess = compileFuture.get(COMPILE_TIMEOUT_SECONDS, TimeUnit.SECONDS);
                } catch (TimeoutException e) {
                    compileFuture.cancel(true);
                    return new ExecutionResult("", "Compilation timed out (>" + COMPILE_TIMEOUT_SECONDS + "s)", true, 0);
                } finally {
                    compileExec.shutdownNow();
                }
            }

            if (!compileSuccess) {
                String errors = compileOut.toString()
                    .replace(dir.toString() + File.separator, ""); // strip temp path
                return new ExecutionResult("", errors.trim(), true, 0);
            }

            // ── Run ──────────────────────────────────────────────────────────
            ProcessBuilder pb = new ProcessBuilder(
                "java",
                "-cp", dir.toString(),
                "-Xmx128m", "-Xss2m",           // memory limits for safety
                mainClass
            );
            pb.directory(dir.toFile());

            long startTime = System.currentTimeMillis();
            Process process = pb.start();
            process.getOutputStream().close(); // no stdin

            ExecutorService runExec = Executors.newFixedThreadPool(2);

            Future<String> stdoutFuture = runExec.submit(() -> {
                StringBuilder sb = new StringBuilder();
                try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                    String line;
                    while ((line = reader.readLine()) != null) {
                        sb.append(line).append("\n");
                    }
                }
                return sb.toString().stripTrailing();
            });

            Future<String> stderrFuture = runExec.submit(() -> {
                StringBuilder sb = new StringBuilder();
                try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getErrorStream()))) {
                    String line;
                    while ((line = reader.readLine()) != null) {
                        sb.append(line).append("\n");
                    }
                }
                return sb.toString().stripTrailing();
            });

            boolean terminated = process.waitFor(RUN_TIMEOUT_SECONDS, TimeUnit.SECONDS);
            long execTime = System.currentTimeMillis() - startTime;

            if (!terminated) {
                process.destroyForcibly();
                runExec.shutdownNow();
                return new ExecutionResult("", "Execution timed out (>" + RUN_TIMEOUT_SECONDS + "s). Check for infinite loops.", false, execTime);
            }

            String stdout = "";
            String stderr = "";
            try {
                stdout = stdoutFuture.get(2, TimeUnit.SECONDS);
                stderr = stderrFuture.get(2, TimeUnit.SECONDS);
            } catch (TimeoutException e) {
                stdout = "(output capture timed out)";
            } finally {
                runExec.shutdownNow();
            }

            return new ExecutionResult(stdout, stderr, false, execTime);

        } catch (Exception e) {
            return new ExecutionResult("", "Internal execution error: " + e.getMessage(), false, 0);
        } finally {
            // Always clean up temp directory
            if (tempDir != null) {
                try {
                    Files.walk(tempDir)
                        .sorted(java.util.Comparator.reverseOrder())
                        .forEach(p -> p.toFile().delete());
                } catch (Exception ignored) {}
            }
        }
    }
}
