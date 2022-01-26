#!/usr/bin/env bash

####    LD structure using plink 1.9
####
set -x;
binary_dir="$HOME/bin";
db_dir="/media/yagoubali/bioinfo3/db/magma" #${binary_dir};
output="LD.out2";
outdir=$1;
population=$2;
ld_analysis=$3; #{pairwise, all_LD_values,clumping }
if [[ "$ld_analysis" = "pairwise" ]]; then
  snp1=$4
  snp2=$5
  ${binary_dir}/plink --bfile ${db_dir}/g1000_${population}/g1000_${population}  \
  --ld $snp1 $snp2 \
  --out  ${outdir}/temp

  awk '/^\s/{print $0}' ${outdir}/temp.log > ${outdir}/results
  sed -i '1d' ${outdir}/results
  grep -v -F "out" ${outdir}/results > ${outdir}/${output}
elif [[ "$ld_analysis" = "all_LD_values" ]]; then
    snp1=$4
    ld_window_kb=$5
    ld_window=$6  #1000
    ld_window_r2=$7

      ${binary_dir}/plink --bfile ${db_dir}/g1000_${population}/g1000_${population}  \
      --r2  --ld-snp $snp1 \
      --ld-window-kb $ld_window_kb \
      --ld-window $ld_window \
      --ld-window-r2 $ld_window_r2 \
      --out ${outdir}/temp

      mv ${outdir}/temp.ld ${outdir}/${output}
elif [[ $ld_analysis = "clumping" ]]; then
  gwas_summary=$4;
  clump_p1=$5;            ## P-value threshold for a SNP to be included as an index SNP. By default, must have p-value no larger than 0.0001
  clump_p2=$6;            ## Secondary significance threshold for clumped SNPs
  clump_r2=$7;            ## LD threshold for clumping
  clump_kb=$8;            ## Physical distance threshold for clumping
  allow_overlap=$9        ## {Yes, No}
  use_gene_region_file=${10} ## {Yes, No}

  clump_range=${11}         ##{glist-hg19, glist-hg38}
  clump_range_border=${12}  ## A window arround  gene bounds by the given number of kilobases, default 0

  allow_overlap_cmd='';
  if [[ "$allow_overlap_cmd" = "Yes" ]]; then
      allow_overlap_cmd='--clump-allow-overlap';
  fi

  gene_region_cmd='';
  if [[ "$use_gene_region_file" = "Yes" ]]; then
     gene_region_cmd="--clump-range ${db_dir}/${clump_range}  \
      --clump-range-border ${clump_range_border}";
  fi

  if [[ "${clump_p1}" > "0.0001" ]]; then
      clump_p1=0.0001;
  fi

  #By default, no variant may belong to more than one clump; remove this restriction with --clump-allow-overlap
  ## GWAS_summary

  #./clumping.sh UKB_bv_height_SMR_0.05.txt outdir eur 0.1 0.05 0.8 1 No  Yes glist-hg19 0

  ${binary_dir}/plink \
      --bfile ${db_dir}/g1000_${population}/g1000_${population} \
      --clump-p1 ${clump_p1} \
      --clump-p2 ${clump_p2} \
      --clump-r2 ${clump_r2} \
      --clump-kb ${clump_kb} \
      --clump ${gwas_summary} \
      --clump-snp-field SNP \
      --clump-field p \
      ${allow_overlap_cmd} \
      ${gene_region_cmd} \
      --out ${outdir}/${output}
fi
#./LD.sh ld_pairwise afr pairwise rs2840528 rs123
#./LD.sh ld_all afr all_LD_values rs2840528  1 1000 0.2
#./LD.sh ld_clump eur clumping UKB_bv_height_SMR_0.05.txt 0.1 0.05 0.8 1 No  Yes glist-hg19 0
