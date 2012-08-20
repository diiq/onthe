(require 'generic-x) ;; we need this

(define-generic-mode 
    'onthe-mode                      ;; name of the mode
  '("//")                            ;; comments start with '#'
  '("break" "case" "catch" "continue" 
    "default" "delete" "else" "finally"
    "for" "if" "in" "instanceof" "switch" 
    "throw" "try" "typeof" "while" "λ" "let")     ;; some keywords
  (mapcar (lambda (s) (cons s 'font-lock-operator)) '("*" "/""%" "+" "-" ">" "<" ">=" "<=" 
    "+=" "-=""==" "!=" "and" "or" "="))    ;; ';' is a a built-in 
  '("\\.onthe$")                       ;; files for which to activate this mode 
  (list 'onthe-mode-setup)         ;; other functions to call
  "A mode for onthe"       ;; doc string for this mode
)

(defun onthe-mode-setup ()
  (setq indent-line-function 'onthe-indent-line)
  (local-set-key (kbd "<backtab>") 'onthe-deindent-line))

(defun onthe-indent-line (&optional whole-exp)
  "Indent current line"
  (interactive)
  (let ((indent (onthe-correct-indentation))
        (pos (- (point-max) (point))) 
        beg)
    (beginning-of-line)
    (setq beg (point))
    (skip-chars-forward " ")
    (if (zerop (- indent (current-column)))
        nil
      (delete-region beg (point))
      (indent-to indent))
    (if (> (- (point-max) pos) (point))
	(goto-char (- (point-max) pos)))
    ))

(defun onthe-deindent-line (&optional whole-exp)
  "DEindent current line"
  (interactive)
  (let ((pos (- (point-max) (point))) 
        beg)
    (beginning-of-line)
    (setq beg (point))
    (skip-chars-forward " ")
    (if (or (onthe-impossible-deindent) (zerop (current-column)))
        nil
      (delete-region beg (+ beg 4)))
    (if (> (- (point-max) pos) (point))
	(goto-char (- (point-max) pos)))
    ))

(defun onthe-impossible-deindent () 
  (save-excursion
    (beginning-of-line)
    (skip-chars-backward "\n ")

    (if (eq (char-before) ?:)
        t)))

(defun onthe-correct-indentation ()
  (save-excursion
    (let (poo)

      (beginning-of-line)
      (skip-chars-backward "\n ")

      (if (or (eq (char-before) ?:) (eq (char-before) ?{))
          (setq poo 4)
        (setq poo 0))

      (beginning-of-line)
      (skip-chars-forward " ")
      (setq poo (+ poo (current-column)))

      poo)))