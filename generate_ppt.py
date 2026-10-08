import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE

def create_presentation():
    prs = Presentation()
    prs.slide_width = Inches(10)
    prs.slide_height = Inches(7.5)

    blank_layout = prs.slide_layouts[6]

    # Colors
    COLOR_NAVY = RGBColor(16, 44, 87)       # #102C57
    COLOR_BLUE = RGBColor(0, 86, 179)       # #0056B3
    COLOR_DARK = RGBColor(33, 37, 41)       # #212529
    COLOR_GRAY = RGBColor(108, 117, 125)    # #6C757D
    COLOR_TEAL_BAR = RGBColor(136, 160, 163) # #88A0A3 (matches the bottom bar in sample)
    COLOR_WHITE = RGBColor(255, 255, 255)
    COLOR_BORDER = RGBColor(0, 0, 0)
    COLOR_LIGHT_BG = RGBColor(248, 249, 250)

    def add_bottom_bar(slide):
        shape = slide.shapes.add_shape(
            MSO_SHAPE.RECTANGLE,
            Inches(0.35), Inches(7.1), Inches(9.3), Inches(0.18)
        )
        shape.fill.solid()
        shape.fill.fore_color.rgb = COLOR_TEAL_BAR
        shape.line.color.rgb = COLOR_TEAL_BAR

    # ==========================================================
    # SLIDE 1: TITLE SLIDE (EXACTLY AS PER PDF FIRST PAGE)
    # ==========================================================
    s1 = prs.slides.add_slide(blank_layout)

    # Outer border box at top for college header
    top_box = s1.shapes.add_shape(
        MSO_SHAPE.RECTANGLE,
        Inches(0.8), Inches(0.35), Inches(8.4), Inches(1.4)
    )
    top_box.fill.background()
    top_box.line.color.rgb = COLOR_BORDER
    top_box.line.width = Pt(1.5)

    tf_top = top_box.text_frame
    tf_top.word_wrap = True
    tf_top.margin_left = Inches(0.1)
    tf_top.margin_right = Inches(0.1)
    tf_top.margin_top = Inches(0.12)
    tf_top.margin_bottom = Inches(0.1)

    p = tf_top.paragraphs[0]
    p.text = "S. B. JAIN INSTITUTE OF TECHNOLOGY, MANAGEMENT"
    p.font.name = "Times New Roman"
    p.font.size = Pt(13)
    p.font.bold = True
    p.font.color.rgb = COLOR_DARK
    p.alignment = PP_ALIGN.CENTER

    p2 = tf_top.add_paragraph()
    p2.text = "& RESEARCH, NAGPUR"
    p2.font.name = "Times New Roman"
    p2.font.size = Pt(13)
    p2.font.bold = True
    p2.font.color.rgb = COLOR_DARK
    p2.alignment = PP_ALIGN.CENTER

    p3 = tf_top.add_paragraph()
    p3.text = "(An Autonomous Institute, Affiliated to R.T.M. Nagpur University)"
    p3.font.name = "Times New Roman"
    p3.font.size = Pt(9.5)
    p3.font.color.rgb = COLOR_DARK
    p3.alignment = PP_ALIGN.CENTER

    p4 = tf_top.add_paragraph()
    p4.text = "DEPARTMENT OF EMERGING TECHNOLOGIES CSE (AI&ML)"
    p4.font.name = "Times New Roman"
    p4.font.size = Pt(11)
    p4.font.bold = True
    p4.font.color.rgb = COLOR_DARK
    p4.alignment = PP_ALIGN.CENTER

    p5 = tf_top.add_paragraph()
    p5.text = '"Become an excellent center for Emerging Technologies in Computer Science to create competent professionals"'
    p5.font.name = "Times New Roman"
    p5.font.size = Pt(7.5)
    p5.font.italic = True
    p5.font.color.rgb = COLOR_DARK
    p5.alignment = PP_ALIGN.CENTER

    # Main Center Seminar Title
    center_box = s1.shapes.add_textbox(Inches(0.8), Inches(1.85), Inches(8.4), Inches(2.8))
    tf_c = center_box.text_frame
    tf_c.word_wrap = True

    p = tf_c.paragraphs[0]
    p.text = "TAE-II"
    p.font.name = "Times New Roman"
    p.font.size = Pt(26)
    p.font.bold = True
    p.font.color.rgb = COLOR_DARK
    p.alignment = PP_ALIGN.CENTER

    p = tf_c.add_paragraph()
    p.text = "Seminar"
    p.font.name = "Times New Roman"
    p.font.size = Pt(24)
    p.font.bold = True
    p.font.color.rgb = COLOR_DARK
    p.alignment = PP_ALIGN.CENTER

    p = tf_c.add_paragraph()
    p.text = "on"
    p.font.name = "Times New Roman"
    p.font.size = Pt(18)
    p.font.bold = True
    p.font.color.rgb = COLOR_DARK
    p.alignment = PP_ALIGN.CENTER

    # Topic Name (Simple topic according to project)
    p = tf_c.add_paragraph()
    p.text = "“Automata-Based Tokenizer”"
    p.font.name = "Times New Roman"
    p.font.size = Pt(24)
    p.font.bold = True
    p.font.color.rgb = COLOR_BLUE
    p.alignment = PP_ALIGN.CENTER

    p = tf_c.add_paragraph()
    p.text = "under the course"
    p.font.name = "Times New Roman"
    p.font.size = Pt(16)
    p.font.bold = True
    p.font.color.rgb = COLOR_BLUE
    p.alignment = PP_ALIGN.CENTER

    p = tf_c.add_paragraph()
    p.text = "Theory of Computation (N-PCCCM503T)"
    p.font.name = "Times New Roman"
    p.font.size = Pt(20)
    p.font.bold = True
    p.font.color.rgb = COLOR_BLUE
    p.alignment = PP_ALIGN.CENTER

    # Bottom Details (Presented by & Guidance)
    # Left: Presented By
    left_box = s1.shapes.add_textbox(Inches(0.8), Inches(4.85), Inches(3.8), Inches(1.2))
    tf_l = left_box.text_frame
    tf_l.word_wrap = True
    p = tf_l.paragraphs[0]
    p.text = "Presented By:"
    p.font.name = "Times New Roman"
    p.font.size = Pt(15)
    p.font.bold = True
    p.font.color.rgb = COLOR_DARK

    p = tf_l.add_paragraph()
    p.text = "Nihal Pawar"
    p.font.name = "Times New Roman"
    p.font.size = Pt(15)
    p.font.bold = True
    p.font.color.rgb = COLOR_DARK

    p = tf_l.add_paragraph()
    p.text = "(CM24027)"
    p.font.name = "Times New Roman"
    p.font.size = Pt(15)
    p.font.bold = True
    p.font.color.rgb = COLOR_DARK

    # Right: Under the Guidance of
    right_box = s1.shapes.add_textbox(Inches(5.6), Inches(4.6), Inches(3.6), Inches(1.2))
    tf_r = right_box.text_frame
    tf_r.word_wrap = True
    p = tf_r.paragraphs[0]
    p.text = "Under the Guidance"
    p.font.name = "Times New Roman"
    p.font.size = Pt(15)
    p.font.bold = True
    p.font.color.rgb = COLOR_DARK
    p.alignment = PP_ALIGN.RIGHT

    p = tf_r.add_paragraph()
    p.text = "of"
    p.font.name = "Times New Roman"
    p.font.size = Pt(15)
    p.font.bold = True
    p.font.color.rgb = COLOR_DARK
    p.alignment = PP_ALIGN.RIGHT

    p = tf_r.add_paragraph()
    p.text = "Dr. Animesh Tayal"
    p.font.name = "Times New Roman"
    p.font.size = Pt(16)
    p.font.bold = True
    p.font.color.rgb = COLOR_DARK
    p.alignment = PP_ALIGN.RIGHT

    # Bottom Session & Department
    bot_box = s1.shapes.add_textbox(Inches(1.0), Inches(6.15), Inches(8.0), Inches(0.9))
    tf_b = bot_box.text_frame
    tf_b.word_wrap = True
    p = tf_b.paragraphs[0]
    p.text = "5th Sem, Session:2026-27 (ODD )"
    p.font.name = "Times New Roman"
    p.font.size = Pt(14)
    p.font.bold = True
    p.font.color.rgb = COLOR_DARK
    p.alignment = PP_ALIGN.CENTER

    p = tf_b.add_paragraph()
    p.text = "Department of Emerging Technologies (AI&ML )"
    p.font.name = "Times New Roman"
    p.font.size = Pt(14)
    p.font.bold = True
    p.font.color.rgb = COLOR_DARK
    p.alignment = PP_ALIGN.CENTER

    add_bottom_bar(s1)

    # ==========================================================
    # HELPER FOR CONTENT SLIDES (SLIDES 2 TO 11)
    # ==========================================================
    def create_content_slide(title_text):
        slide = prs.slides.add_slide(blank_layout)
        title_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.4), Inches(8.4), Inches(0.9))
        tf = title_box.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = title_text
        p.font.name = "Arial"
        p.font.size = Pt(26)
        p.font.bold = True
        p.font.color.rgb = COLOR_DARK
        add_bottom_bar(slide)
        return slide

    # ==========================================================
    # SLIDE 2: INDEX
    # ==========================================================
    s2 = create_content_slide("INDEX")
    tb2 = s2.shapes.add_textbox(Inches(0.8), Inches(1.5), Inches(8.4), Inches(5.2))
    tf2 = tb2.text_frame
    tf2.word_wrap = True

    index_items = [
        "1. Problem Statement",
        "2. Theoretical Context",
        "3. Formal Mathematical Definition",
        "4. Automaton / Model Design / Logic Breakdown",
        "5. Complexity & Minimality Analysis",
        "6. Real-World CSE Applications",
        "7. Comparative Analysis",
        "8. Conclusion & Key Takeaways",
        "9. References."
    ]

    for idx, item in enumerate(index_items):
        p = tf2.paragraphs[0] if idx == 0 else tf2.add_paragraph()
        p.text = item
        p.font.name = "Arial"
        p.font.size = Pt(20)
        p.font.color.rgb = COLOR_DARK
        p.space_after = Pt(10)

    # ==========================================================
    # SLIDE 3: 1. PROBLEM STATEMENT
    # ==========================================================
    s3 = create_content_slide("1. Problem Statement")
    tb3 = s3.shapes.add_textbox(Inches(0.8), Inches(1.8), Inches(8.4), Inches(4.8))
    tf3 = tb3.text_frame
    tf3.word_wrap = True

    p = tf3.paragraphs[0]
    p.text = "Automata-Based Tokenizer:"
    p.font.name = "Arial"
    p.font.size = Pt(22)
    p.font.bold = True
    p.font.color.rgb = COLOR_DARK
    p.space_after = Pt(14)

    p = tf3.add_paragraph()
    p.text = "Given an input raw text stream and a set of regular expression token rules (such as Word, Number, Decimal, Operator, and Identifier), design and implement a finite-state machine model that deterministically scans characters and converts them into structured integer token IDs for machine learning / LLM preprocessing."
    p.font.name = "Arial"
    p.font.size = Pt(20)
    p.font.color.rgb = COLOR_DARK
    p.space_after = Pt(14)

    p = tf3.add_paragraph()
    p.text = "The model must process arbitrary text streams in deterministic linear time without backtracking, resolve rule priority conflicts, and output format-ready integer sequences."
    p.font.name = "Arial"
    p.font.size = Pt(18)
    p.font.color.rgb = COLOR_GRAY

    # ==========================================================
    # SLIDE 4: 2. THEORETICAL CONTEXT
    # ==========================================================
    s4 = create_content_slide("2. Theoretical Context")
    tb4 = s4.shapes.add_textbox(Inches(0.8), Inches(1.5), Inches(8.4), Inches(5.2))
    tf4 = tb4.text_frame
    tf4.word_wrap = True

    bullets4 = [
        ("• Chomsky Hierarchy Placement:", " Type 3 (Regular Language).", True),
        ("• Language Definition:", "", True),
        ("  L = { w ∈ Σ* | w matches a recognized token rule pattern }", "", False),
        ("  Where Σ is the input character alphabet (letters, digits, symbols, whitespace).", "", False),
        ("• Memory & Determinism Property:", "", True),
        ("  • Tokenization requires tracking only finite state history (bounded O(1) runtime memory).", "", False),
        ("  • Since lexeme patterns are regular expressions, they compile to Finite Automata (NFA & DFA).", "", False),
        ("  • The maximal munch (longest-match) rule ensures sequential, deterministic character consumption in linear O(|w|) time.", "", False)
    ]

    for idx, (b_title, b_desc, is_bold) in enumerate(bullets4):
        p = tf4.paragraphs[0] if idx == 0 else tf4.add_paragraph()
        p.text = b_title + b_desc
        p.font.name = "Arial"
        p.font.size = Pt(17)
        p.font.bold = is_bold
        p.font.color.rgb = COLOR_DARK
        p.space_after = Pt(8)

    # ==========================================================
    # SLIDE 5: 3. FORMAL MATHEMATICAL DEFINITION
    # ==========================================================
    s5 = create_content_slide("3. Formal Mathematical Definition")
    tb5 = s5.shapes.add_textbox(Inches(0.8), Inches(1.5), Inches(8.4), Inches(5.4))
    tf5 = tb5.text_frame
    tf5.word_wrap = True

    p = tf5.paragraphs[0]
    p.text = "For a token language, the Deterministic Finite Automaton M is defined as:"
    p.font.name = "Arial"
    p.font.size = Pt(17)
    p.font.color.rgb = COLOR_DARK
    p.space_after = Pt(6)

    p = tf5.add_paragraph()
    p.text = "M = (Q, Σ, δ, q0, F)"
    p.font.name = "Arial"
    p.font.size = Pt(20)
    p.font.bold = True
    p.font.color.rgb = COLOR_BLUE
    p.space_after = Pt(8)

    math_bullets = [
        "• State Set (Q): Q = {q0, q1, q2, ..., qk}, where each state represents a canonical subset of NFA states generated via Subset Construction.",
        "• Alphabet (Σ): Complete character set (ASCII / UTF-8 printable characters).",
        "• Start State (q0): q0 ∈ Q (represents the initial state: q0 = ε-closure(s_start)).",
        "• Accepting States (F): F ⊆ Q (states that identify complete valid tokens, mapped to a unique Token ID and Priority Rank).",
        "• Transition Function (δ): δ : Q × Σ → Q defined by:",
        "    δ(q, c) = ε-closure(move(q, c))   {where q ∈ Q & c ∈ Σ}"
    ]

    for item in math_bullets:
        p = tf5.add_paragraph()
        p.text = item
        p.font.name = "Arial"
        p.font.size = Pt(15.5)
        p.font.color.rgb = COLOR_DARK
        p.space_after = Pt(6)

    # ==========================================================
    # SLIDE 6: 4. AUTOMATON & MODEL DESIGN
    # ==========================================================
    s6 = create_content_slide("4. Automaton & Model Design")

    # Pipeline summary text
    tb6_top = s6.shapes.add_textbox(Inches(0.8), Inches(1.3), Inches(8.4), Inches(1.0))
    tf6_t = tb6_top.text_frame
    tf6_t.word_wrap = True
    p = tf6_t.paragraphs[0]
    p.text = "• Model Pipeline: Regex Rules → Thompson NFA → Subset DFA → Minimized DFA"
    p.font.name = "Arial"
    p.font.size = Pt(15)
    p.font.bold = True
    p.font.color.rgb = COLOR_BLUE

    p = tf6_t.add_paragraph()
    p.text = "• Longest-Match Logic: Reads stream sequentially, tracking last accepting state."
    p.font.name = "Arial"
    p.font.size = Pt(14)
    p.font.color.rgb = COLOR_DARK

    # Table on slide 6
    rows, cols = 6, 4
    left, top, width, height = Inches(0.8), Inches(2.3), Inches(8.4), Inches(4.5)
    table_shape = s6.shapes.add_table(rows, cols, left, top, width, height)
    table = table_shape.table

    table.columns[0].width = Inches(2.0)
    table.columns[1].width = Inches(1.6)
    table.columns[2].width = Inches(1.8)
    table.columns[3].width = Inches(3.0)

    table_data = [
        ["Current State", "Input Symbol", "Next State", "Token Rule / Reason"],
        ["q0 (Start)", "[a-zA-Z_]", "q1 (Accepting)", "IDENTIFIER token started"],
        ["q0 (Start)", "'if', 'for'...", "q2 (Accepting)", "KEYWORD (Priority 1) recognized"],
        ["q0 (Start)", "[0-9]", "q3 (Accepting)", "INTEGER token started"],
        ["q0 (Start)", "[+\\-*/=<>!]", "q4 (Accepting)", "OPERATOR token recognized"],
        ["q0 (Start)", "\\s (spaces/tabs)", "q5 (Accepting)", "WHITESPACE token recognized"]
    ]

    for r_idx, row in enumerate(table_data):
        for c_idx, val in enumerate(row):
            cell = table.cell(r_idx, c_idx)
            cell.text = val
            p = cell.text_frame.paragraphs[0]
            p.font.name = "Arial"
            p.font.size = Pt(13)
            if r_idx == 0:
                p.font.bold = True
                p.font.color.rgb = COLOR_WHITE
                cell.fill.solid()
                cell.fill.fore_color.rgb = COLOR_NAVY
            else:
                p.font.color.rgb = COLOR_DARK
                cell.fill.solid()
                cell.fill.fore_color.rgb = COLOR_LIGHT_BG if r_idx % 2 == 1 else COLOR_WHITE

    # ==========================================================
    # SLIDE 7: 5. COMPLEXITY & MINIMALITY ANALYSIS
    # ==========================================================
    s7 = create_content_slide("5. Complexity & Minimality Analysis")
    tb7 = s7.shapes.add_textbox(Inches(0.8), Inches(1.5), Inches(8.4), Inches(5.2))
    tf7 = tb7.text_frame
    tf7.word_wrap = True

    comp_items = [
        ("Time Complexity of Tokenization: O(|w|)", "— Deterministic linear scan of input text w with no backtracking."),
        ("NFA Construction Time: O(n)", "— Linear construction of states and transitions using Thompson's Algorithm."),
        ("Space Complexity of DFA: O(|Q|)", "— Constant O(1) runtime memory buffer; DFA transitions stored in compact jump table."),
        ("State Minimality (Hopcroft Partition Refinement):", ""),
        ("• States are initially partitioned into non-accepting and distinct token-accepting equivalence classes.", ""),
        ("• Iterative refinement merges indistinguishable states, achieving significant state reduction (e.g., 28% to 45% reduction).", ""),
        ("• By Myhill-Nerode theorem, the resulting minimized DFA is guaranteed to be canonical and minimal.", "")
    ]

    for idx, (head, body) in enumerate(comp_items):
        p = tf7.paragraphs[0] if idx == 0 else tf7.add_paragraph()
        p.text = head + " " + body
        p.font.name = "Arial"
        p.font.size = Pt(16.5)
        p.font.color.rgb = COLOR_DARK
        if "Complexity" in head or "Minimality" in head:
            p.font.bold = True
            p.space_after = Pt(6)
        else:
            p.space_after = Pt(8)

    # ==========================================================
    # SLIDE 8: 6. REAL-WORLD CSE APPLICATIONS
    # ==========================================================
    s8 = create_content_slide("6. Real-World CSE Applications")
    tb8 = s8.shapes.add_textbox(Inches(0.8), Inches(1.5), Inches(8.4), Inches(5.2))
    tf8 = tb8.text_frame
    tf8.word_wrap = True

    apps = [
        ("• LLM & NLP Preprocessing:", " Converting raw text prompts into discrete integer token sequences and attention masks for Transformers (GPT, BERT, LLaMA)."),
        ("• Compiler Design (Lexical Analysis):", " Front-end lexers (Lex, Flex, Clang) scanning source code into semantic tokens."),
        ("• Network Security & Packet Inspection:", " Hardware-level deep packet filtering using deterministic finite automata against malicious payload signatures."),
        ("• Database Query Engines:", " Fast lexical scanning of SQL queries and structured log parsing."),
        ("• High-Performance Text Indexing:", " Search engine indexing and deterministic sub-string filtering at over 250,000 tokens/sec.")
    ]

    for idx, (title, desc) in enumerate(apps):
        p = tf8.paragraphs[0] if idx == 0 else tf8.add_paragraph()
        p.text = title + desc
        p.font.name = "Arial"
        p.font.size = Pt(16.5)
        p.font.color.rgb = COLOR_DARK
        p.space_after = Pt(12)

    # ==========================================================
    # SLIDE 9: 7. COMPARATIVE ANALYSIS
    # ==========================================================
    s9 = create_content_slide("7. Comparative Analysis")
    tb9 = s9.shapes.add_textbox(Inches(0.8), Inches(1.5), Inches(8.4), Inches(5.2))
    tf9 = tb9.text_frame
    tf9.word_wrap = True

    p = tf9.paragraphs[0]
    p.text = "Computational Model Suitability:"
    p.font.name = "Arial"
    p.font.size = Pt(20)
    p.font.bold = True
    p.font.color.rgb = COLOR_BLUE
    p.space_after = Pt(12)

    comps = [
        ("• DFA vs NFA:", " NFA allows non-deterministic ε-transitions requiring backtracking or set tracking O(|Q|·|w|). DFA executes in strict linear O(|w|) time with zero backtracking."),
        ("• DFA vs PDA (Pushdown Automata):", " PDA introduces an unbounded stack used for nested grammar parsing. Tokenization only requires regular lexical structure, making PDA unnecessary and inefficient."),
        ("• DFA vs Turing Machine (TM):", " Turing Machines possess infinite tape memory and are undecidable. DFA provides guaranteed termination, minimal memory footprint, and maximal throughput."),
        ("• Elimination of ReDoS:", " Deterministic automata eliminate catastrophic backtracking vulnerabilities present in naive regular expression matching engines.")
    ]

    for item, body in comps:
        p = tf9.add_paragraph()
        p.text = item + body
        p.font.name = "Arial"
        p.font.size = Pt(16.5)
        p.font.color.rgb = COLOR_DARK
        p.space_after = Pt(10)

    # ==========================================================
    # SLIDE 10: 8. CONCLUSION & KEY TAKEAWAYS
    # ==========================================================
    s10 = create_content_slide("8. Conclusion & Key Takeaways")
    tb10 = s10.shapes.add_textbox(Inches(0.8), Inches(1.5), Inches(8.4), Inches(5.2))
    tf10 = tb10.text_frame
    tf10.word_wrap = True

    concls = [
        ("Automated Construction: ", "Demonstrated an end-to-end mathematical pipeline translating regular expressions directly into a minimal DFA in linear time."),
        ("Bridge from Theory to AI: ", "Mapped formal Chomsky Type-3 automata theory directly to modern LLM preprocessing (BOS, EOS, Padding, and Attention Masks)."),
        ("Guaranteed Determinism: ", "Proved that lexical token extraction with Maximal Munch guarantees optimal longest-match selection in O(|w|) execution time."),
        ("State Minimality: ", "Verified via Hopcroft's algorithm that redundant states can be pruned without altering token classification semantics.")
    ]

    for idx, (title, desc) in enumerate(concls):
        p = tf10.paragraphs[0] if idx == 0 else tf10.add_paragraph()
        p.text = title + desc
        p.font.name = "Arial"
        p.font.size = Pt(17)
        p.font.color.rgb = COLOR_DARK
        p.space_after = Pt(12)

    # ==========================================================
    # SLIDE 11: 9. REFERENCES
    # ==========================================================
    s11 = create_content_slide("9. References")
    tb11 = s11.shapes.add_textbox(Inches(0.8), Inches(1.5), Inches(8.4), Inches(5.2))
    tf11 = tb11.text_frame
    tf11.word_wrap = True

    p = tf11.paragraphs[0]
    p.text = "Textbooks & Academic References:"
    p.font.name = "Arial"
    p.font.size = Pt(18)
    p.font.bold = True
    p.font.color.rgb = COLOR_DARK
    p.space_after = Pt(12)

    refs = [
        "1. Hopcroft, J. E., Motwani, R., & Ullman, J. D. Introduction to Automata Theory, Languages, and Computation (3rd ed.). Pearson.",
        "2. Sipser, M. Introduction to the Theory of Computation (3rd ed.). Cengage Learning.",
        "3. Aho, A. V., Lam, M. S., Sethi, R., & Ullman, J. D. Compilers: Principles, Techniques, and Tools (2nd ed. - Dragon Book). Addison-Wesley.",
        "4. Thompson, K. (1968). Programming Techniques: Regular Expression Search Algorithm. Communications of the ACM, 11(6), 419-422.",
        "5. Vaswani, A., et al. (2017). Attention Is All You Need. Advances in Neural Information Processing Systems (NeurIPS)."
    ]

    for item in refs:
        p = tf11.add_paragraph()
        p.text = item
        p.font.name = "Arial"
        p.font.size = Pt(15.5)
        p.font.color.rgb = COLOR_DARK
        p.space_after = Pt(10)

    # Save presentation
    output_path = "e:/trafficrule/automata-tokenizer/Automata_Based_Tokenizer_Seminar.pptx"
    prs.save(output_path)
    print(f"Presentation saved successfully at: {output_path}")
    return output_path

if __name__ == "__main__":
    create_presentation()
