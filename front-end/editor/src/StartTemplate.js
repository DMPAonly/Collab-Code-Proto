const STARTER_TEMPLATES = {
    javascript: '// Write JavaScript code here\nconsole.log("Hello, World!");',
    python: '# Write Python code here\nprint("Hello, World!")',
    clike: '// Write C code here\n#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}',
    'clike-cpp': '// Write C++ code here\n#include <iostream>\n\nint main() {\n    std::cout << "Hello, World!" << std::endl;\n    return 0;\n}',
    'clike-java': '// Write Java code here\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}',
    'clike-csharp': '// Write C# code here\nusing System;\n\nclass Program {\n    static void Main() {\n        Console.WriteLine("Hello, World!");\n    }\n}',
};

export default STARTER_TEMPLATES;